---
name: GraphQL Mobile
description: GraphQL client integration for mobile applications
version: 1.0.0
category: API Integration
slug: graphql-mobile
status: active
---

# GraphQL Mobile Skill

## Overview

This skill provides GraphQL client integration capabilities for mobile applications. It enables configuration of Apollo Client, code generation, caching strategies, and real-time subscriptions.

## Allowed Tools

- `bash` - Execute codegen and build tools
- `read` - Analyze GraphQL schemas and queries
- `write` - Generate typed operations and configurations
- `edit` - Update GraphQL implementations
- `glob` - Search for GraphQL files
- `grep` - Search for patterns

## Capabilities

### Apollo Client (React Native)

1. **Client Configuration**
   - Configure Apollo Client
   - Set up HTTP and WebSocket links
   - Configure authentication
   - Handle error policies

2. **Caching**
   - Configure InMemoryCache
   - Implement type policies
   - Handle cache normalization
   - Configure persistence

### Code Generation

3. **GraphQL Codegen**
   - Generate TypeScript types
   - Generate React hooks
   - Generate fragments
   - Handle custom scalars

### Flutter GraphQL

4. **graphql_flutter**
   - Configure GraphQL client
   - Implement queries and mutations
   - Handle subscriptions
   - Configure caching

### Native Clients

5. **Apollo iOS**
   - Configure Apollo iOS client
   - Generate Swift types
   - Handle caching
   - Implement subscriptions

6. **Apollo Android**
   - Configure Apollo Kotlin client
   - Generate Kotlin types
   - Handle normalized cache

### Real-time

7. **Subscriptions**
   - Configure WebSocket links
   - Handle reconnection
   - Implement subscription hooks
   - Manage active subscriptions

## Target Processes

- `graphql-apollo-integration.js` - GraphQL implementation
- `offline-first-architecture.js` - Offline caching
- `mobile-performance-optimization.js` - Query optimization

## Dependencies

- Apollo Client
- GraphQL Codegen
- Platform-specific GraphQL libraries

## Usage Examples

### Apollo Client Setup (React Native)

```typescript
// apollo/client.ts
import { ApolloClient, InMemoryCache, createHttpLink, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { setContext } from '@apollo/client/link/context';
import { createClient } from 'graphql-ws';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AsyncStorageWrapper, CachePersistor } from 'apollo3-cache-persist';

const httpLink = createHttpLink({
  uri: 'https://api.example.com/graphql',
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: 'wss://api.example.com/graphql',
    connectionParams: async () => {
      const token = await AsyncStorage.getItem('authToken');
      return { authorization: token ? `Bearer ${token}` : '' };
    },
  })
);

const authLink = setContext(async (_, { headers }) => {
  const token = await AsyncStorage.getItem('authToken');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
  },
  wsLink,
  authLink.concat(httpLink)
);

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        posts: {
          keyArgs: false,
          merge(existing = [], incoming) {
            return [...existing, ...incoming];
          },
        },
      },
    },
  },
});

export const persistor = new CachePersistor({
  cache,
  storage: new AsyncStorageWrapper(AsyncStorage),
});

export const client = new ApolloClient({
  link: splitLink,
  cache,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});
```

### GraphQL Codegen Configuration

```yaml
# codegen.yml
schema: https://api.example.com/graphql
documents: 'src/**/*.graphql'
generates:
  src/generated/graphql.ts:
    plugins:
      - typescript
      - typescript-operations
      - typescript-react-apollo
    config:
      withHooks: true
      withComponent: false
      withHOC: false
      skipTypename: false
      dedupeFragments: true
```

### Query Hook Usage

```typescript
// features/posts/hooks/usePosts.ts
import { usePostsQuery, useCreatePostMutation } from '../../../generated/graphql';

export function usePosts() {
  const { data, loading, error, refetch, fetchMore } = usePostsQuery({
    variables: { first: 10 },
    notifyOnNetworkStatusChange: true,
  });

  const [createPost] = useCreatePostMutation({
    update(cache, { data }) {
      cache.modify({
        fields: {
          posts(existingPosts = []) {
            const newPostRef = cache.writeFragment({
              data: data?.createPost,
              fragment: PostFragmentDoc,
            });
            return [newPostRef, ...existingPosts];
          },
        },
      });
    },
    optimisticResponse: (variables) => ({
      __typename: 'Mutation',
      createPost: {
        __typename: 'Post',
        id: 'temp-id',
        title: variables.title,
        body: variables.body,
        createdAt: new Date().toISOString(),
      },
    }),
  });

  const loadMore = () => {
    if (data?.posts.pageInfo.hasNextPage) {
      fetchMore({
        variables: {
          after: data.posts.pageInfo.endCursor,
        },
      });
    }
  };

  return {
    posts: data?.posts.edges.map((e) => e.node) ?? [],
    loading,
    error,
    refetch,
    loadMore,
    createPost,
  };
}
```

### Apollo iOS Setup

```swift
// Apollo/Network.swift
import Apollo
import ApolloWebSocket

class Network {
    static let shared = Network()

    private(set) lazy var apollo: ApolloClient = {
        let store = ApolloStore(cache: InMemoryNormalizedCache())

        let provider = DefaultInterceptorProvider(store: store)
        let url = URL(string: "https://api.example.com/graphql")!

        let transport = RequestChainNetworkTransport(
            interceptorProvider: provider,
            endpointURL: url
        )

        return ApolloClient(networkTransport: transport, store: store)
    }()
}
```

## Quality Gates

- Type safety via codegen
- Query complexity limits
- Cache consistency verified
- Subscription reconnection tested

## Related Skills

- `rest-api-integration` - REST integration
- `offline-storage` - Offline caching
- `firebase-mobile` - Firebase alternative

## Version History

- 1.0.0 - Initial release
