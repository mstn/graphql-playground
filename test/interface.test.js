import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  GraphQLSchema,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLString,
  GraphQLObjectType,
  GraphQLInterfaceType,
  graphql,
} from 'graphql';

const data = [
  { id: 1, name: 'John', surname: 'Doe', language: 'java' },
  { id: 2, name: 'a place', address: 'a long address'}
];

describe('Query on schema returning an interface', () => {

  const ThingInterface = new GraphQLInterfaceType({
    name: "ThingInterface",
    fields: {
      name: { type: new GraphQLNonNull(GraphQLString) }
    }
  });

  const PersonType = new GraphQLObjectType({
    name: 'PersonType',
    interfaces: [ ThingInterface ],
    fields: {
      name: { type: new GraphQLNonNull(GraphQLString) },
      surname: { type: GraphQLString }
    },
    isTypeOf(value, info){
      return !!value.surname;
    }
  });
  const PlaceType = new GraphQLObjectType({
    name: 'PlaceType',
    interfaces: [ ThingInterface ],
    fields: {
      name: { type: new GraphQLNonNull(GraphQLString) },
      address: { type: GraphQLString }
    },
    isTypeOf(value, info){
      return !!value.address;
    }
  });
  const ProgrammerType = new GraphQLObjectType({
    name: 'ProgrammerType',
    interfaces: [ ThingInterface ],
    fields: {
      name: { type: new GraphQLNonNull(GraphQLString) },
      language: { type: GraphQLString }
    },
    isTypeOf(value, info){
      return !!value.language;
    }
  });

  const rootType = new GraphQLObjectType({
    name: 'Root',
    fields: {
      things: {
        type: ThingInterface,
        args: {
          entityId: { type: new GraphQLNonNull(GraphQLInt) }
        },
        resolve: (_, {entityId}) => data[entityId-1]
      }
    }
  });

  const schema = new GraphQLSchema({
    types: [  PersonType, ProgrammerType, PlaceType ],
    query: rootType
  });

  it('returns person if type is PersonType', async () => {
    const result = await graphql(schema, `
      {
        things(entityId: 1) {
          ... on PersonType {
            name
            surname
          }
        }
      }
    `);
    expect(result.data).to.deep.equal({
     things: { name: 'John', surname: 'Doe' }
    });
  });
  it('returns empty if type is not PersonType', async () => {
    const result = await graphql(schema, `
      {
        things(entityId: 2) {
          ... on PersonType {
            name
            surname
          }
        }
      }
    `);
    expect(result.data).to.deep.equal({
     things: { }
   });
  });
  it('does not return an error if no inline fragment', async () => {
    const result = await graphql(schema, `
      {
        things(entityId: 1) {
          name
        }
      }
    `);
    expect(result.data).to.deep.equal({
      things: { name: 'John' }
    });
  });

  it('fetches the first object implementing an interface, others are ignored', async () => {
    // NB: it does not depend on the order in which inline fragments appear in the query
    // de facto fragments implement a XOR logic
    const personSchema = new GraphQLSchema({
      types: [  PersonType, ProgrammerType, PlaceType ],
      query: rootType
    });
    const programmerSchema = new GraphQLSchema({
      types: [  ProgrammerType, PersonType, PlaceType ],
      query: rootType
    });
    const personResult = await graphql(personSchema, `
      {
        things(entityId: 1) {
          name
          ... on PersonType {
            surname
          }
          ... on ProgrammerType {
            language
          }
        }
      }
    `);
    expect(personResult.data).to.deep.equal({
     things: { name: 'John', surname: 'Doe' }
    });
    const programmerResult = await graphql(programmerSchema, `
      {
        things(entityId: 1) {
          name
          ... on PersonType {
            surname
          }
          ... on ProgrammerType {
            language
          }
        }
      }
    `);
    expect(programmerResult.data).to.deep.equal({
     things: { name: 'John', language: 'java' }
    });
  });
});
