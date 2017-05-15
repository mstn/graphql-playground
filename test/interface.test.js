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
  { id: 1, name: 'John', surname: 'Doe' },
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
    types: [ PersonType, PlaceType],
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
});
