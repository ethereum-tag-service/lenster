import { gql, useQuery } from '@apollo/client';
import Loader from '@components/Shared/Loader';
import { Button } from '@components/UI/Button';
import { ErrorMessage } from '@components/UI/ErrorMessage';
import { Form, useZodForm } from '@components/UI/Form';
import { Input } from '@components/UI/Input';
import { ArrowLeftIcon, BookmarkIcon, PlusIcon } from '@heroicons/react/outline';
import { XCircleIcon } from '@heroicons/react/solid';
import type { Dispatch, FC } from 'react';
import { useState } from 'react';
import { useAppStore } from 'src/store/app';
import { object, string } from 'zod';

interface Props {
  bookmarkedFolders: string[];
  addOrRemoveBookmark: Dispatch<string>;
}

// Validation for the hashtag/folder name
const noWhitespaceRegExp = /^\S*$/;
const folderDataSchema = object({
  value: string()
    .startsWith('#', { message: 'Folder name must start with a # character.' })
    .min(1, { message: 'Must be 1 or more characters long' })
    .max(32, { message: 'Must be 32 or fewer characters long' })
    .regex(noWhitespaceRegExp, { message: "Can't contain spaces" })
    .trim()
});

// This query takes the current user's address and returns tagging records
// with the record type of "bookmark" which will give us the list of folders.
const BOOKMARK_FOLDERS_QUERY = gql`
  query Bookmarks($id: String!, $first: Int!, $skip: Int!, $orderBy: String!) {
    tagger(id: $id, first: $first, skip: $skip, orderBy: $orderBy, orderDirection: desc) {
      tags(where: { taggingRecords_: { recordType: "bookmark" } }) {
        id
        display
      }
    }
  }
`;

const Folders: FC<Props> = ({ bookmarkedFolders, addOrRemoveBookmark }) => {
  const currentProfile = useAppStore((state) => state.currentProfile);
  const currentUserAddress = currentProfile?.ownedBy;
  const [showFolderEntry, setShowFolderEntry] = useState<boolean>(false);

  const form = useZodForm({
    schema: folderDataSchema,
    defaultValues: {
      value: ''
    }
  });

  // This fetches and sets the bookmark folders list
  // for the current user address. Setting this to a
  // default of 500 folders.
  const { error, data, loading } = useQuery(BOOKMARK_FOLDERS_QUERY, {
    variables: {
      id: currentUserAddress?.toLowerCase(),
      skip: 0,
      first: 500,
      orderBy: 'timestamp'
    },
    // Important to not cache so we can get the latest list of folders
    fetchPolicy: 'no-cache',
    context: { clientName: 'ets' }
  });

  if (loading) {
    return <Loader message="Loading bookmarks" />;
  }

  return (
    <>
      {!showFolderEntry && (
        <div className="mx-5 mt-3.5 mb-1.5">
          <button
            onClick={() => setShowFolderEntry(true)}
            className="flex items-center space-x-1.5 font-bold text-brand hover:text-brand-600"
          >
            <PlusIcon className="w-4 h-4" />
            <div>New folder</div>
          </button>
        </div>
      )}
      <div className="py-3.5 px-5 space-y-3">
        <ErrorMessage title="Failed to load bookmarks" error={error} />
        {showFolderEntry ? (
          <div className="space-y-5">
            <button
              onClick={() => {
                setShowFolderEntry(false);
                form.setValue('value', '');
              }}
              className="flex items-center space-x-1.5 font-bold text-gray-500"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <div>Back</div>
            </button>
            <Form
              form={form}
              className="space-y-4"
              onSubmit={() => addOrRemoveBookmark(form.getValues('value'))}
            >
              <Input
                label="Name"
                helper={
                  <span>
                    The max length for a bookmark folder name is 32 characters and it can't contain spaces. It
                    must contain a # character at the beginning.
                  </span>
                }
                type="text"
                autoFocus
                maxLength={32}
                {...form.register('value')}
              />
              <Button type="submit" disabled={!form.watch('value') || parseFloat(form.watch('value')) <= 0}>
                Create and tag
              </Button>
            </Form>
          </div>
        ) : (
          <>
            <h2 className="font-bold">Select a folder</h2>
            {/* // This is the list of bookmark folders */}
            {data?.tagger?.tags?.map((bookmark: any) => (
              <div key={bookmark?.id}>
                <button
                  type="button"
                  className="w-full p-3 text-left group border dark:border-gray-700/80 hover:border-gray-300 rounded-xl flex items-center justify-between"
                  onClick={() => addOrRemoveBookmark(bookmark.display)}
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <div className="text-brand">
                        {bookmarkedFolders.includes(bookmark.display) ? (
                          <BookmarkIcon className="w-4 fill-brand-500 group-hover:fill-brand-600" />
                        ) : (
                          <BookmarkIcon className="w-4 group-hover:stroke-brand-600" />
                        )}
                      </div>
                      <div className="space-x-1.5 font-bold">{bookmark.display}</div>
                    </div>
                  </div>
                  {bookmarkedFolders.includes(bookmark.display) && (
                    <div className="inline-flex items-center text-red-500 group-hover:text-red-600">
                      <span className="text-xs">Remove</span>
                      <XCircleIcon className="w-6 h-6 ml-1" />
                    </div>
                  )}
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </>
  );
};

export default Folders;
