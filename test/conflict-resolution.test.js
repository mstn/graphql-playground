import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  GraphQLSchema,
  GraphQLNonNull,
  GraphQLBoolean,
  GraphQLInt,
  GraphQLString,
  GraphQLObjectType,
  GraphQLInterfaceType,
  graphql,
} from 'graphql';

describe('Query selection set', () => {


  const data = [
    { id: 1, name: 'John', surname: 'Doe' },
    { id: 2, name: 'Jane', surname: 'Dee' },
  ];

  const AddressType = new GraphQLObjectType({
    name: 'AddressType',
    fields: {
      street: { type: GraphQLString },
      streetNumber: { type: GraphQLInt },
    }
  });

  const PersonType = new GraphQLObjectType({
    name: 'PersonType',
    fields: {
      name: { type: GraphQLString },
      surname: { type: GraphQLString },
      address: {
        type: AddressType,
        args: {
          secondResidence: { type: GraphQLBoolean }
        },
        resolve(parent, {secondResidence}) {
          return {
            street: 'Abbey Road'
          };
        }
      }
    }
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
      }
    },
  });
  const schema = new GraphQLSchema({
    query: RootType
  });

  it('merges duplicate fields', async () => {
    const result = await graphql(schema, `
      {
        user(id: 1) {
          name
          name
        }
      }
    `);
    expect(result.data).to.deep.equal({
      user: { name: 'John' }
    });
  });

  it('merges duplicate fields if same arguments', async () => {
    const result = await graphql(schema, `
      {
        user(id: 1) {
          name
        }
        user(id: 1) {
          name
        }
      }
    `);
    expect(result.data).to.deep.equal({
      user: { name: 'John' }
    });
  });

  it('cannot merge fields if different arguments', async () => {
    const result = await graphql(schema, `
      {
        user(id: 1) {
          name
        }
        user(id: 2) {
          name
        }
      }
    `);
    expect(result.errors[0].message).to.match(/Fields \"user\" conflict because they have differing arguments/);
  });

  it('cannot merge fields if nested different arguments', async () => {
    const result = await graphql(schema, `
      {
        user(id: 1) {
          address(secondResidence: false) {
            street
          }
        }
        user(id: 1) {
          address(secondResidence: true) {
            street
          }
        }
      }
    `);
    expect(result.errors[0].message).to.match(/Fields \"user\" conflict because subfields \"address\" conflict because they have differing arguments/);
  });
});
