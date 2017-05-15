import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  GraphQLSchema,
  GraphQLObjectType,
} from 'graphql';

describe('new GraphQLSchema', () => {

  it('must provide configuration object', async () => {
    expect( () => {
      const schema = new GraphQLSchema();
    }).to.throw(Error, /Must provide configuration object/);
  });

  it('must have root fields with field names', async () => {
    const rootType = new GraphQLObjectType({
      name: 'Root',
      fields: {}
    });
    expect( () => {
      const schema = new GraphQLSchema({ query: rootType });
    }).to.throw(Error, /Root fields must be an object with field names/);
  });
});
