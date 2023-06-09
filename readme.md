# gpt-autodocs

gpt-autodocs is a tool that leverages the power of AI language models to automatically generate relevant comments for specific tags in source code. It makes use of the ChatGPT API to interact with GPT-4 or another language model.

## Features

- Automatically generates insightful comments for `<comment here>` tags in source code.
- Supports customization through additional prompts.
- Handles large source code files by extracting snippets for annotation.
- Provides progress updates during the annotation process.
- Easy integration with TypeScript projects.

## Prerequisites

Before using gpt-autodocs, make sure you have the following:

- ChatGPT API key: You'll need a valid API key to access the GPT-4 language model. If you don't have one, reach out to obtain an API key from the GPT-4 API provider.
- Node.js
- Yarn

## Installation

1. Clone the repository:

```shell
git clone https://github.com/Orloaft/gpt-autodocs.git
```

2. Navigate to the project directory:

```shell
cd gpt-autodocs
```

3. Install the dependencies:

```shell
yarn install
```

4. Set the environment variable:

```shell
export CHATGPT_API_KEY=your-api-key
```

## Usage

To use gpt-autodocs, follow these steps:

1. Prepare your source code files:

   - Place the files to be annotated in the `src` directory.
   - Add `<comment here>` tags in the code where you want comments to be generated.

2. Run the annotator:

```shell
yarn start path_to_file
```

- The tool will prompt you for additional prompts. Provide any specific instructions or prompts to customize the comments generated.
- The annotator will process the source code files and generate annotated versions with comments replacing the `<comment here>` tags.
- The annotated files will be saved in the `output` directory.

3. Review the annotated files:
   - Check the annotated files in the `output` directory.
   - Each `<comment here>` tag will be replaced with a relevant comment generated by the AI model.

## Customization

gpt-autodocs allows you to customize the comments generated by providing additional prompts. When prompted during the annotation process, you can enter specific instructions, questions, or any other text that helps guide the AI model in generating relevant comments.

## Limitations

- Large files: The annotator handles large source code files by extracting smaller snippets for annotation. However, extremely large files may still pose a challenge and may require manual splitting of the code.
- AI model limitations: The quality of the generated comments depends on the capabilities and training of the underlying AI language model. While efforts have been made to improve accuracy, the results may not always be perfect or contextually accurate.

## Contributing

Contributions are welcome! If you find any issues or have ideas for improvements, please open an issue or submit a pull request. Make sure to follow the project's code style and guidelines.

## License

gpt-autodocs is open source and released under the [MIT License](https://opensource.org/licenses/MIT).

```

Please use this updated code snippet for your gpt-autodocs project's README.md file on GitHub.
```
