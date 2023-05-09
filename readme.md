# GPT-autodocs

GPT-autodocs is an open-source project that uses OpenAI's GPT language model to automatically generate documentation for TypeScript code. It can help developers save time and effort by generating documentation for functions and methods that have no or incomplete documentation.

## Getting Started

To get started with GPT-autodocs, you'll need to have an OpenAI API key. Add your API key to your shell startup file (`.zshrc`, `.bashrc`, etc.) as follows:

```
export CHATGPT_API_KEY=${apikey}
```

Next, clone the GPT-autodocs repository:

```
git clone https://github.com/AztecProtocol/gpt-autodocs.git
```

Install the required dependencies using Yarn:

```
yarn
```

To generate documentation for a TypeScript file, run the following command:

```
CHATGPT_UPDATES=1 yarn start <path-to-typescript-file>
```

## Contributing

We welcome contributions from the community! If you find a bug or have an idea for an improvement, feel free to submit a pull request.

Before submitting a pull request, please ensure that your changes pass the existing tests and linting rules. You can run the tests using the following command:

```
yarn test
```

## License

GPT-autodocs is released under the MIT License. See `LICENSE` for more information.
