import { gql, useQuery } from '@apollo/client';
import SinglePublication from '@components/Publication/SinglePublication';
import PublicationsShimmer from '@components/Shared/Shimmer/PublicationsShimmer';
import { Card } from '@components/UI/Card';
import { EmptyState } from '@components/UI/EmptyState';
import { ErrorMessage } from '@components/UI/ErrorMessage';
import InfiniteLoader from '@components/UI/InfiniteLoader';
import type { LensterPublication } from '@generated/types';
import { ArrowLeftIcon, ArrowRightIcon, BookmarkIcon } from '@heroicons/react/outline';
import { SCROLL_THRESHOLD } from 'data/constants';
import { motion } from 'framer-motion';
import type { Profile } from 'lens';
import { useProfileFeedQuery } from 'lens';
import type { FC } from 'react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useAppStore } from 'src/store/app';

interface Props {
  profile: Profile;
}

// Get all of the tags for the profile and filter them by
// "bookmark" record type. This will give us our "folders".
const BOOKMARK_FOLDERS_QUERY = gql`
  query Bookmarks($id: String!, $first: Int!, $skip: Int!, $orderBy: String!) {
    tagger(id: $id, first: $first, skip: $skip, orderBy: $orderBy, orderDirection: desc) {
      tags(where: { taggingRecords_: { recordType: "bookmark" } }) {
        display
      }
    }
  }
`;

// Get our bookmarked publications for the current folder/tag by
// the profile owner address, the tag name, and the "bookmark"
// record type.
const BOOKMARKS_QUERY = gql`
  query BookmarkFolder($id: String!, $first: Int!, $skip: Int!, $orderBy: String!, $name: String!) {
    taggingRecords: taggingRecords(
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: desc
      where: { tags_: { display: $name }, tagger_: { id: $id }, recordType: "bookmark" }
    ) {
      target {
        targetURI
      }
    }
  }
`;

const Feed: FC<Props> = ({ profile }) => {
  const currentProfile = useAppStore((state) => state.currentProfile);
  const [publicationIds, setPublicationIds] = useState<string[]>([]);
  const [bookmarks, setBookmarks] = useState<object[]>([]);
  const [currentBookmark, setCurrentBookmark] = useState<string>('');

  const handleSelectFolder = (bookmark: string) => {
    setCurrentBookmark(bookmark);

    if (bookmark) {
      // TODO: get list of (10 at a time) publication IDs from specific bookmark folders
      // setPublicationIds(['0x3592-0x01', '0x3592-0x02', '0x3592-0x06', '0x3592-0x05']);
    } else {
      setPublicationIds([]);
    }
  };

  // The current logged in user's bookmarks or the profile's bookmarks
  const profileAddress =
    currentProfile?.ownedBy === profile?.ownedBy
      ? currentProfile?.ownedBy.toLowerCase()
      : profile?.ownedBy.toLowerCase();

  const { data: bookmarkFoldersData, loading: bookmarkFoldersDataLoading } = useQuery(
    BOOKMARK_FOLDERS_QUERY,
    {
      variables: {
        id: profileAddress,
        skip: 0,
        first: 500,
        orderBy: 'timestamp'
      },
      skip: !profile?.id,
      fetchPolicy: 'no-cache',
      onCompleted(data) {
        setBookmarks(data?.tagger?.tags);
      },
      onError() {
        toast.error('Error loading bookmark folders');
      },
      context: { clientName: 'ets' }
    }
  );

  const { loading: bookmarksDataLoading } = useQuery(BOOKMARKS_QUERY, {
    variables: {
      id: profileAddress,
      skip: 0,
      first: 500,
      name: currentBookmark,
      orderBy: 'timestamp'
    },
    skip: !profile?.id,
    fetchPolicy: 'no-cache',
    onCompleted(data) {
      const arrayOfPublicationIds = data?.taggingRecords.map((record: any) => {
        // Get the publication ID from the URI
        return record.target.targetURI.split(':').at(-1);
      });

      setPublicationIds(arrayOfPublicationIds);
    },
    onError() {
      toast.error(`Error loading bookmarks for ${currentBookmark}`);
    },
    context: { clientName: 'ets' }
  });

  const request = { publicationIds, limit: 10 };
  const reactionRequest = currentProfile ? { profileId: currentProfile?.id } : null;
  const profileId = currentProfile?.id ?? null;

  const { data, loading, error, refetch, fetchMore } = useProfileFeedQuery({
    variables: { request, reactionRequest, profileId },
    skip: !profile?.id
  });

  // Fetch when publicationIds changes
  useEffect(() => {
    refetch();
  }, [publicationIds, refetch]);

  const publications = data?.publications?.items;
  const pageInfo = data?.publications?.pageInfo;
  const hasMore = pageInfo?.next && publications?.length !== pageInfo.totalCount;

  const loadMore = async () => {
    await fetchMore({
      variables: { request: { ...request, cursor: pageInfo?.next }, reactionRequest, profileId }
    });
  };

  if (loading || bookmarkFoldersDataLoading || bookmarksDataLoading) {
    return <PublicationsShimmer />;
  }

  if (!bookmarks) {
    return (
      <EmptyState
        message={
          <div>
            <span className="mr-1 font-bold">@{profile?.handle}</span>
            <span>has nothing in their bookmark feed yet!</span>
          </div>
        }
        icon={<BookmarkIcon className="w-8 h-8 text-brand" />}
      />
    );
  }

  if (error) {
    return <ErrorMessage title="Failed to load bookmark feed" error={error} />;
  }

  if (!currentBookmark && bookmarkFoldersData?.hashtags?.length !== 0) {
    return (
      <Card className="divide-y-[1px] dark:divide-gray-700/80 ">
        {bookmarks?.map((bookmark: any, index: number) => (
          <button
            type="button"
            className="flex items-center justify-between w-full px-5 py-3 space-x-2 text-lg font-bold text-left hover:bg-gray-50 sm:first:rounded-t-xl sm:last:rounded-b-xl dark:hover:bg-gray-800"
            key={`${bookmark?.id}_${index}`}
            onClick={() => handleSelectFolder(bookmark?.display)}
          >
            <div className="flex-grow">{bookmark?.display}</div>
            <div>
              <ArrowRightIcon className="w-4 h-4 text-brand" />
            </div>
          </button>
        ))}
      </Card>
    );
  }

  return (
    <InfiniteScroll
      dataLength={publications?.length ?? 0}
      scrollThreshold={SCROLL_THRESHOLD}
      hasMore={hasMore}
      next={loadMore}
      loader={<InfiniteLoader />}
    >
      <Card className="divide-y-[1px] dark:divide-gray-700/80">
        <div className="flex items-center px-5 py-3 space-x-6">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              handleSelectFolder('');
            }}
            aria-label="Choose Bookmark Folder"
          >
            <div className="p-1.5 rounded-full text-gray-500 hover:bg-gray-300 hover:bg-opacity-20">
              <ArrowLeftIcon className="w-4 h-4" />
            </div>
          </motion.button>
          <div className="text-lg font-bold">{currentBookmark}</div>
        </div>
        {publications?.map((publication, index: number) => (
          <SinglePublication
            key={`${publication.id}_${index}`}
            publication={publication as LensterPublication}
          />
        ))}
      </Card>
    </InfiniteScroll>
  );
};

export default Feed;
