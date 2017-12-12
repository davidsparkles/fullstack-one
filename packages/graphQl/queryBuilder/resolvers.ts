import {
  parseResolveInfo
} from 'graphql-parse-resolve-info';

import {
  getQueryResolver
} from './sqlGenerator/read';

import {
  getMutationResolver
} from './sqlGenerator/mutate';

import {
  getInstance
} from '../../core';

/* ======================================================= */

// Note: The normal import isn't working here for some reason. This is why I import via require.

// tslint:disable-next-line:import-name
// import GraphQLJSON from 'graphql-type-json';

// tslint:disable-next-line:no-var-requires
const graphqlTypeJson = require('graphql-type-json');

/* ======================================================= */

export function getResolvers(gQlTypes, dbObject, queries, mutations) {
  const queryResolver = getQueryResolver(gQlTypes, dbObject);
  const mutationResolver = getMutationResolver(gQlTypes, dbObject, mutations);

  /* const one = getInstance();
  const pool = one.getDbPool();

  pool.query('SELECT * FROM pg_config').then((value) => {
    // tslint:disable-next-line:no-console
    console.log(value);
  }); */

  const queryResolvers = {};
  const mutationResolvers = {};

  Object.values(queries).forEach((query) => {
    queryResolvers[query.name] = (obj, args, context, info) => {
        // tslint:disable-next-line:no-console
        console.log('!! QUERY !!   ' +  + query.name);
        // tslint:disable-next-line:no-console
        console.log(JSON.stringify(info, null, 2));
        // tslint:disable-next-line:no-console
        console.log(JSON.stringify(parseResolveInfo(info), null, 2));
        // tslint:disable-next-line:no-console
        console.log('>>>>SQL>>>> ============================================ ');
        // tslint:disable-next-line:no-console
        console.log(queryResolver(obj, args, context, info).sql);

        // return [{id:13, firstLetterOfUserName: 'A'}];
        return [{
          id: 12,
          email: 'dustin@fullstack.build',
          _typenames: ['USER_ME']
        }, {
          id: 13,
          email: 'eugene@fullstack.build',
          firstLetterOfUserName: 'A',
          _typenames: ['USER_AUTHOR']
        }];
    };
  });

  Object.values(mutations).forEach((mutation) => {
    mutationResolvers[mutation.name] = (obj, args, context, info) => {

        // tslint:disable-next-line:no-console
        console.log('CON', context);
        // tslint:disable-next-line:no-console
        console.log('!! MUTATION !!   ' +  + mutation.name);
        // tslint:disable-next-line:no-console
        console.log('>>>>SQL>>>> ============================================');

        const mutationQuery = mutationResolver(obj, args, context, info);
        // tslint:disable-next-line:no-console
        console.log(mutationQuery.sql, mutationQuery.values);
        try {
          // tslint:disable-next-line:no-console
          console.log(queryResolver(obj, args, context, info).sql);
        } catch (e) {
          // tslint:disable-next-line:no-console
          console.log('NO RETURN QUERY');
        }
        // return [{id:13, firstLetterOfUserName: 'A'}];
        return {
          id: 12,
          title: 'first Post',
          _typenames: ['POST_OWNER']
        };
    };
  });

  const resolvers = {
    JSON: graphqlTypeJson,
    Query: queryResolvers,
    Mutation: mutationResolvers
  };

  return resolvers;
}
