module.exports = {
  preset: 'ts-jest',
  verbose: true,
  moduleFileExtensions: [
    "ts",
    "js"
  ],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest"
  },
  roots: [
    'packages/',
  ]
};