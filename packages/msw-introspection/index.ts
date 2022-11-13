import { graphql } from "msw";
import {
  buildClientSchema,
  execute,
  GraphQLSchema,
  IntrospectionQuery,
} from "graphql";
import { addMocksToSchema } from "@graphql-tools/mock";
import { gql } from "@apollo/client";
import { compose } from "ramda";

const createIntrospectionSchema = (introspection: unknown) =>
  buildClientSchema(introspection as IntrospectionQuery);

// TODO: Extend signature to include mocks
const createMockedSchema = (introspectionSchema: GraphQLSchema) =>
  addMocksToSchema({ schema: introspectionSchema });

const gqlMockedSchemaHandler =
  (mockedSchema: GraphQLSchema) =>
  async (
    ...[req, res, context]: Parameters<Parameters<typeof graphql.query>[1]>
  ) => {
    const { query, variables } = req.body
      ? { query: req.body.query, variables: req.body.variables }
      : { query: null, variables: null };

    const result = await execute({
      schema: mockedSchema,
      document: gql`
        ${query}
      `,
      rootValue: null,
      contextValue: null,
      variableValues: variables,
    });
    return result.data
      ? res(context.data(result.data))
      : res(context.errors(result.errors));
  };

export const createIntrospectionHandler = compose(
  gqlMockedSchemaHandler,
  createMockedSchema,
  createIntrospectionSchema
);