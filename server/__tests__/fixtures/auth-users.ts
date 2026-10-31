export const authUserFixtures = [
  {
    username: "fixture-a",
    displayName: "Fixture Account A",
    password: "fixture-a-test-password",
    status: "active",
  },
  {
    username: "fixture-b",
    displayName: "Fixture Account B",
    password: "fixture-b-test-password",
    status: "active",
  },
  {
    username: "fixture-disabled",
    displayName: "Disabled Fixture",
    password: "fixture-disabled-password",
    status: "disabled",
  },
] as const;
