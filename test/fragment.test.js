import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  GraphQLSchema,
  GraphQLInt,
  GraphQLString,
  GraphQLObjectType,
  GraphQLInterfaceType,
  GraphQLUnionType,
  graphql,
} from 'graphql';

const data = [
  { id: 1, name: 'John', surname: 'Doe' },
  { id: 2, name: 'Jane', surname: 'Dee' },
];

const AnimalInterface = new GraphQLInterfaceType({
  name: "AnimalInterface",
  fields: {
    name: { type: GraphQLString }
  }
});

const PersonType = new GraphQLObjectType({
  name: 'PersonType',
  interfaces: [ AnimalInterface ],
  fields: {
    name: { type: GraphQLString },
    surname: { type: GraphQLString },
  },
  isTypeOf(value, info){
    return !!value.surname;
  }
});

const PlaceType = new GraphQLObjectType({
  name: 'PlaceType',
  fields: {
    name: { type: GraphQLString },
    address: { type: GraphQLString }
  },
  isTypeOf(value, info){
    return !!value.address;
  }
});

const PersonOrPlaceType = new GraphQLUnionType({
  name: 'PersonOrPlaceType',
  types: [PersonType, PlaceType]
});

const RootType = new GraphQLObjectType({
  name: 'RootType',
  fields: {
    user: {
      type: PersonType,
      args: {
        id: { type: GraphQLInt }
      },
      resolve: (_, {id}) => data[id-1]
    },
    animal: {
      type: AnimalInterface,
      args: {
        id: { type: GraphQLInt }
      },
      resolve: (_, {id}) => data[id-1]
    }
  },
});
const schema = new GraphQLSchema({
  types: [ PlaceType, PersonOrPlaceType ],
  query: RootType
});

describe('Schema', () => {
  it('does not admit fragments whose type condition is unrelated to the returning type', async () => {
    const result = await graphql(schema, `
      {
        user(id: 1) {
          ... on PlaceType {
            name
          }
        }
      }
    `);
    expect(result.errors[0].message).to.match(/Fragment cannot be spread here as objects of type \"PersonType\" can never be of type \"PlaceType\"/);
  });

  it('admits fragments whose type condition is a supertype', async () => {
    const result = await graphql(schema, `
      {
        user(id: 1) {
          ... on AnimalInterface {
            name
          }
        }
      }
    `);
    expect(result.data).to.deep.equal({
      user: { name: 'John' }
    });
  });
  it('... but the selection set must be consistent with the supertype', async () => {
    const result = await graphql(schema, `
      {
        user(id: 1) {
          ... on AnimalInterface {
            name
            surname
          }
        }
      }
    `);
    expect(result.errors[0].message).to.match(/Cannot query field "surname" on type \"AnimalInterface\"/);

  });
  it('admits fragments whose type condition is a subtype', async () => {
    const result = await graphql(schema, `
      {
        animal(id: 1) {
          ... on PersonType {
            name
            surname
          }
        }
      }
    `);
    expect(result.data).to.deep.equal({
      animal: { name: 'John', surname: 'Doe' }
    });
  });
  it('does not admin fragments whose type condition is union type', async () => {
    const result = await graphql(schema, `
      {
        user(id: 1) {
          ... on PersonOrPlaceType {
            name
          }
        }
      }
    `);
    expect(result.errors[0].message).to.match(/Cannot query field \"name\" on type \"PersonOrPlaceType\"/);
  });
  it('... but only because unions cannot have a selection set', async () => {
    const result = await graphql(schema, `
      {
        user(id: 1) {
          ... on PersonOrPlaceType {
            ... on PersonType {
              name
            }
          }
        }
      }
    `);
    expect(result.data).to.deep.equal({
      user: { name: 'John' }
    });
  });
});

describe('Schema with a unique possible type as output', () => {

  it('admits fragments in selection set', async () => {
    const result = await graphql(schema, `
      {
        user(id: 1) {
          ... on PersonType {
            name
          }
        }
      }
    `);
    expect(result.data).to.deep.equal({
      user: { name: 'John' }
    });
  });

});
