export const ETSPublisher = [
  {
    inputs: [
      {
        internalType: 'string',
        name: '_publisherName',
        type: 'string'
      },
      {
        internalType: 'contract IETS',
        name: '_ets',
        type: 'address'
      },
      {
        internalType: 'contract IETSToken',
        name: '_etsToken',
        type: 'address'
      },
      {
        internalType: 'contract IETSTarget',
        name: '_etsTarget',
        type: 'address'
      },
      {
        internalType: 'address payable',
        name: '_creator',
        type: 'address'
      },
      {
        internalType: 'address payable',
        name: '_owner',
        type: 'address'
      }
    ],
    stateMutability: 'nonpayable',
    type: 'constructor'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousOwner',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address'
      }
    ],
    name: 'OwnershipTransferred',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'account',
        type: 'address'
      }
    ],
    name: 'Paused',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'publisherAddress',
        type: 'address'
      }
    ],
    name: 'PublisherOwnerChanged',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'publisherAddress',
        type: 'address'
      }
    ],
    name: 'PublisherPauseToggledByOwner',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'account',
        type: 'address'
      }
    ],
    name: 'Unpaused',
    type: 'event'
  },
  {
    inputs: [],
    name: 'IID_IETSPublisher',
    outputs: [
      {
        internalType: 'bytes4',
        name: '',
        type: 'bytes4'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'NAME',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'string',
            name: 'targetURI',
            type: 'string'
          },
          {
            internalType: 'string[]',
            name: 'tagStrings',
            type: 'string[]'
          },
          {
            internalType: 'string',
            name: 'recordType',
            type: 'string'
          }
        ],
        internalType: 'struct IETS.TaggingRecordRawInput[]',
        name: '_rawInput',
        type: 'tuple[]'
      }
    ],
    name: 'applyTags',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_newOwner',
        type: 'address'
      }
    ],
    name: 'changeOwner',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'string',
            name: 'targetURI',
            type: 'string'
          },
          {
            internalType: 'string[]',
            name: 'tagStrings',
            type: 'string[]'
          },
          {
            internalType: 'string',
            name: 'recordType',
            type: 'string'
          }
        ],
        internalType: 'struct IETS.TaggingRecordRawInput',
        name: '_rawInput',
        type: 'tuple'
      },
      {
        internalType: 'enum IETS.TaggingAction',
        name: '_action',
        type: 'uint8'
      }
    ],
    name: 'computeTaggingFee',
    outputs: [
      {
        internalType: 'uint256',
        name: 'fee',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'tagCount',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'creator',
    outputs: [
      {
        internalType: 'address payable',
        name: '',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'ets',
    outputs: [
      {
        internalType: 'contract IETS',
        name: '',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'etsTarget',
    outputs: [
      {
        internalType: 'contract IETSTarget',
        name: '',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'etsToken',
    outputs: [
      {
        internalType: 'contract IETSToken',
        name: '',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getCreator',
    outputs: [
      {
        internalType: 'address payable',
        name: '',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'string[]',
        name: '_tags',
        type: 'string[]'
      }
    ],
    name: 'getOrCreateTagIds',
    outputs: [
      {
        internalType: 'uint256[]',
        name: '_tagIds',
        type: 'uint256[]'
      }
    ],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getOwner',
    outputs: [
      {
        internalType: 'address payable',
        name: '',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getPublisherName',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'isPausedByOwner',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'pause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'paused',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'publisherName',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'string',
            name: 'targetURI',
            type: 'string'
          },
          {
            internalType: 'string[]',
            name: 'tagStrings',
            type: 'string[]'
          },
          {
            internalType: 'string',
            name: 'recordType',
            type: 'string'
          }
        ],
        internalType: 'struct IETS.TaggingRecordRawInput[]',
        name: '_rawInput',
        type: 'tuple[]'
      }
    ],
    name: 'removeTags',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'string',
            name: 'targetURI',
            type: 'string'
          },
          {
            internalType: 'string[]',
            name: 'tagStrings',
            type: 'string[]'
          },
          {
            internalType: 'string',
            name: 'recordType',
            type: 'string'
          }
        ],
        internalType: 'struct IETS.TaggingRecordRawInput[]',
        name: '_rawInput',
        type: 'tuple[]'
      }
    ],
    name: 'replaceTags',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'bytes4',
        name: 'interfaceId',
        type: 'bytes4'
      }
    ],
    name: 'supportsInterface',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newOwner',
        type: 'address'
      }
    ],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'unpause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
];
