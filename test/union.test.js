import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  GraphQLSchema,
  GraphQLInt,
  GraphQLString,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLNonNull,
  graphql,
} from 'graphql';

const data = [
  { id: 1, name: 'John', surname: 'Doe' },
  { id: 2, name: 'a place', address: 'a long address'}
];

const buildSchemaWithUnion = (types) => {
  const PersonOrPlaceType = new GraphQLUnionType({
    name: 'PersonOrPlaceType',
    types
  });

  const rootType = new GraphQLObjectType({
    name: 'Root',
    fields: {
      things: {
        type: PersonOrPlaceType,
        args: {
          entityId: { type: new GraphQLNonNull(GraphQLInt) }
        },
        resolve: (_, {entityId}) => data[entityId-1]
      }
    }
  });

  return new GraphQLSchema({ query: rootType });
};

describe('Building schema without dicriminated union', () => {

    const PersonType = new GraphQLObjectType({
      name: 'PersonType',
      fields: {
        name: { type: GraphQLString },
        surname: { type: GraphQLString }
      }
    });
    const PlaceType = new GraphQLObjectType({
      name: 'PlaceType',
      fields: {
        name: { type: GraphQLString },
        address: { type: GraphQLString }
      }
    });

    it('returns an error "union type without resolveType or object types without isTypeOf"', async () => {
      expect( () => {
        buildSchemaWithUnion([ PersonType, PlaceType ]);
      }).to.throw(Error, /Union type \"PersonOrPlaceType\" does not provide a \"resolveType\" function and possible type \"PersonType\" does not provide an \"isTypeOf\" function. There is no way to resolve this possible type during execution\./);
    });
});

describe('Query on schema with dicriminated union', () => {

  const PersonType = new GraphQLObjectType({
    name: 'PersonType',
    fields: {
      name: { type: GraphQLString },
      surname: { type: GraphQLString }
    },
    isTypeOf(value, info){
      return value.name && value.surname;
    }
  });
  const PlaceType = new GraphQLObjectType({
    name: 'PlaceType',
    fields: {
      name: { type: GraphQLString },
      address: { type: GraphQLString }
    },
    isTypeOf(value, info){
      return value.name && value.address;
    }
  });

  const schema = buildSchemaWithUnion([ PersonType, PlaceType ]);

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
  it('returns an error if no inline fragment', async () => {
    const result = await graphql(schema, `
      {
        things(entityId: 1) {
          name
        }
      }
    `);
    expect(result.errors[0].message).to.match(/Cannot query field \"name\" on type \"PersonOrPlaceType\"\. Did you mean to use an inline fragment on \"PersonType\" or \"PlaceType\"/);
  });
});
