import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  GraphQLInt,
  GraphQLInputObjectType,
  GraphQLUnionType,
} from 'graphql';

describe('GraphQLInputObjectType', () => {
  it('cannot create unions of input types', async () => {
    const inputA = new GraphQLInputObjectType({
      name: 'A',
      fields: {
        kind: { type: GraphQLInt }
      }
    });
    const inputB = new GraphQLInputObjectType({
      name: 'B',
      fields: {
        kind: { type: GraphQLInt }
      }
    });
    const union = new GraphQLUnionType({
      name: 'AorB',
      types: [ inputB, inputA ]
    });
    expect( () => {
      union.getTypes();
    }).to.throw(Error, /may only contain Object types/);
  });
});
