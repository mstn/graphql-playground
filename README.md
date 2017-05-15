> A test suite to show some properties of GraphQL language

GraphQL is a great language, but, as far I know, it lacks a formal definition of its semantics. For this reason, it is often hard to prove properties of the language.

Here, I am collecting a set of tests for GraphQL reference implementation to show some properties of the language that could not be immediately evident from the API or from the [semi-formal spec](https://facebook.github.io/graphql/). I am interested in some limit cases that are not usually covered by classical examples.

My final goal is to reverse engineer the formal semantics of GraphQL. [Here](https://github.com/mstn/graphql) some very preliminary work in this direction.

The test suite is far from being complete and it will never be. ;P

## How to start

Prove language properties running some tests.

```
$ npm install
$ npm test
```

## Case studies

## Union of Input Object Types is not allowed

Union of input types is not allowed. The reason is that union of input types yields some ambiguities that make type inference impossible [1].

Imo, the same problem is potentially present for `GraphQLObjectType`. However, in this case it is solved using a sort of tagged unions. I do not understand why the same strategy is not applied for `GraphQLInputObjectType`. Moreover, I would get rid of `GraphQLInputObjectType`, completely.

Having `GraphQLObjectType` for input type as well should be ok. As a positive side effect, we would have inheritance, too. We need only to pay a bit of attention when defining the subtyping relation between queries and schemas since it must be contra-variant (as the analogy with function calls suggests).

The ambiguity with union types is a well-known problem in the literature. For example, see the classic text "Types and Programming Languages" by Pierce (15.7, pp. 206-207).

References
- [1] https://github.com/graphql/graphql-js/issues/207

## Union type as result of a query

Let us condider a schema `things(entityId: Int): PersonOrPlaceType` where type `PersonOrPlaceType`, union of two `GraphQLObjectType`, that is, `PersonType` and `PlaceType`.

Then the following query seems legit to me:

```
{
  things(entityId: 1) {
    name
  }
}
```

Indeed, `name` is a property belonging to the intersection of `PersonType` and `PlaceType`. However,
GraphQL returns an error and requires to use a fragment. Note that, if we use interfaces, we do not get an error.
