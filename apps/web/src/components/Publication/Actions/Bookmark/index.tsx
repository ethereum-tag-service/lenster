import { gql, useQuery } from '@apollo/client';
import Loader from '@components/Shared/Loader';
import { Modal } from '@components/UI/Modal';
import { Tooltip } from '@components/UI/Tooltip';
import type { LensterPublication } from '@generated/types';
import { BookmarkIcon } from '@heroicons/react/outline';
import { Leafwatch } from '@lib/leafwatch';
import { ETSPublisher } from 'abis';
import { ETS_PUBLISHER, SIGN_WALLET } from 'data/constants';
import { utils } from 'ethers';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import type { FC } from 'react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAppStore } from 'src/store/app';
import { PUBLICATION } from 'src/tracking';
import { useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi';

const Folders = dynamic(() => import('./Folders'), {
  loading: () => <Loader message="Loading collect" />
});

interface Props {
  publication: LensterPublication;
  isFullPublication: boolean;
}

interface RawInput {
  targetURI: string;
  tagStrings: string[];
  recordType: string;
}

// This query allows us to pass the tagger address
// (Lenster profile owner address) and the publication
// ID to the ETS subgraph to see if a publication has
// been bookmarked. If it returns a non-empty array,
// it is bookmarked.
const IS_BOOKMARKED_QUERY = gql`
  query IsBookmarked($id: String!, $publicationId: String!) {
    taggingRecords(
      where: {
        tagger_: { id: $id }
        target_: { targetURI_ends_with_nocase: $publicationId }
        recordType: "bookmark"
      }
    ) {
      tags {
        display
      }
    }
  }
`;

const Bookmark: FC<Props> = ({ publication, isFullPublication }) => {
  const currentProfile = useAppStore((state) => state.currentProfile);
  const currentUserAddress = currentProfile?.ownedBy;
  const [showModal, setShowModal] = useState<boolean>(false);
  const [bookmarked, setBookmarked] = useState<boolean>(false);
  const [bookmarkFolderList, setBookmarkFolderList] = useState<string[]>([]);
  const [applyTagsRawInput, setApplyTagsRawInput] = useState<RawInput>({
    targetURI: '',
    tagStrings: [],
    recordType: ''
  });

  // This query will run whenever the publication is loaded.
  // It searched the ETS subgraph to see if a publicationId
  // with the tagger address exists. If it returns a non-empty
  // array, then it is bookmarked. There is likely a better
  // way to do this depending on how the data strcture is
  // setup in the app. (i.e. getting all of the publication IDs,
  // from the Lens API and then searching once per publication
  // response on the ETS subgraph with a batch query and then
  // running a publication ID comparison between both arrays)
  const { data } = useQuery(IS_BOOKMARKED_QUERY, {
    variables: {
      id: currentUserAddress?.toLowerCase(),
      publicationId: publication.id
    },
    skip: !currentUserAddress,
    // Important to not cache so we can get the latest bookmarking status
    fetchPolicy: 'no-cache',
    onCompleted(data: any) {
      if (data?.taggingRecords?.length === 0) {
        return;
      }

      const tags = data.taggingRecords[0].tags.map((tag: any) => tag.display);
      setBookmarkFolderList(tags);

      // There can be an empty tagging record with no tags if you remove all
      // of the tags from the tagging record.
      if (tags.length) {
        setBookmarked(true);
      }
    },
    context: { clientName: 'ets' }
  });

  // Contract interactions
  const contractBase = {
    address: ETS_PUBLISHER,
    abi: ETSPublisher
  };

  // This is the contract write interaction with ETS
  // that will write our bookmark to the blockchain.
  const { data: addBookmarkData, write: addBookmarkWrite } = useContractWrite({
    ...contractBase,
    functionName: 'applyTags',
    mode: 'recklesslyUnprepared',
    onSuccess() {
      toast.success('Adding bookmark');
      Leafwatch.track(PUBLICATION.BOOKMARKS.ADD);
    },
    onError(error: any) {
      toast.error(error?.data?.message ?? error?.message);
    }
  });

  const waitForAddBookmarkTransaction = useWaitForTransaction({
    hash: addBookmarkData?.hash,
    onSuccess() {
      toast.success('Bookmark successfully added!');
      setBookmarked(true);
    }
  });

  const { data: removeBookmarkData, write: removeBookmarkWrite } = useContractWrite({
    ...contractBase,
    functionName: 'removeTags',
    mode: 'recklesslyUnprepared',
    onSuccess() {
      toast.success('Removing bookmark');
      Leafwatch.track(PUBLICATION.BOOKMARKS.REMOVE);
    },
    onError(error: any) {
      toast.error(error?.data?.message ?? error?.message);
    }
  });

  const waitForRemoveBookmarkTransaction = useWaitForTransaction({
    hash: removeBookmarkData?.hash,
    onSuccess() {
      toast.success('Bookmark successfully removed!');
      setBookmarked(false);
    }
  });

  // Upon success, the tagging fee contract call will immediately call
  // addBookmarkWrite and write the bookmark to the blockchain
  const { refetch: fetchFee } = useContractRead({
    ...contractBase,
    functionName: 'computeTaggingFee',
    args: [applyTagsRawInput, 0],
    enabled: false,
    onSuccess(data: any) {
      addBookmarkWrite?.({
        recklesslySetUnpreparedArgs: [[applyTagsRawInput]],
        recklesslySetUnpreparedOverrides: {
          value: data.fee,
          gasPrice: utils.parseUnits('10', 'gwei')
        }
      });
    },
    onError(error: any) {
      toast.error(error?.data?.message ?? error?.message);
    }
  });

  // Every time the applyTagsRawInput changes, we need to refetch
  // the fee calculation from the contract which will then write
  // the bookmark to the blockchain upon fee calculation success.
  useEffect(() => {
    // This conditional is needed in order to prevent the fee
    // calculation from running which will just throw errors
    // if there are no tag strings.
    if (applyTagsRawInput.tagStrings.length) {
      fetchFee();
    }
  }, [applyTagsRawInput, fetchFee]);

  const composeRawInput = (tagString: string): RawInput => {
    const publicationId = publication?.__typename === 'Mirror' ? publication?.mirrorOf?.id : publication?.id;
    const targetURI = `blink:polygon:mainnet:0xDb46d1Dc155634FbC732f92E853b10B288AD5a1d:${publicationId}`;

    return {
      targetURI: targetURI,
      tagStrings: [tagString],
      recordType: 'bookmark'
    };
  };

  // Setting the raw input will trigger the useEffect and call the
  // fee calculation from the contract and then once we have a fee
  // returned from the contract/onSuccess it will immediately call
  // the addBookmarkWrite function.
  const addBookmark = async (folder: string) => {
    const rawInput = composeRawInput(folder);
    setShowModal(false);
    setApplyTagsRawInput(rawInput);
  };

  const removeBookmark = async (folder: string) => {
    const rawInput = composeRawInput(folder);
    setShowModal(false);
    removeBookmarkWrite?.({ recklesslySetUnpreparedArgs: [[rawInput]] });
  };

  const addOrRemoveBookmark = async (folder: string) => {
    if (!currentProfile) {
      return toast.error(SIGN_WALLET);
    }

    // Remove the bookmark if it's already bookmarked after confirming
    if (bookmarkFolderList.includes(folder)) {
      if (confirm('Are you sure you want to remove this bookmark?')) {
        removeBookmark(folder);
      }
      return;
    }

    // If the bookmark is not already bookmarked, add it
    addBookmark(folder);
  };

  const openBookmarks = () => {
    if (!currentProfile) {
      return toast.error(SIGN_WALLET);
    }

    setShowModal(true);
    Leafwatch.track(PUBLICATION.BOOKMARKS.OPEN_BOOKMARKS);
  };

  const iconClassName = isFullPublication ? 'w-[17px] sm:w-[20px]' : 'w-[15px] sm:w-[18px]';

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={openBookmarks}
        aria-label={bookmarked ? 'Bookmarked' : 'Choose Bookmark Folder'}
      >
        <div className="flex items-center space-x-1 text-orange-500">
          <div className="p-1.5 rounded-full hover:bg-orange-300 hover:bg-opacity-20">
            <Tooltip placement="top" content={bookmarked ? 'Bookmarked' : 'Bookmark'} withDelay>
              {bookmarked ? (
                <BookmarkIcon className={`${iconClassName} fill-orange-500`} />
              ) : (
                <BookmarkIcon className={iconClassName} />
              )}
            </Tooltip>
          </div>
        </div>
      </motion.button>
      <Modal
        title="My bookmark folders"
        icon={<BookmarkIcon className="w-5 h-5 text-brand" />}
        show={showModal}
        onClose={() => setShowModal(false)}
      >
        <Folders bookmarkedFolders={bookmarkFolderList} addOrRemoveBookmark={addOrRemoveBookmark} />
      </Modal>
    </>
  );
};

export default Bookmark;
