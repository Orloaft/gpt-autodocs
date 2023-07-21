import * as fs from "fs";
import * as readline from "readline";
import { ChatGPTAPI } from "chatgpt";

if (!process.env.CHATGPT_API_KEY) {
  throw new Error(
    "You need to set CHATGPT_API_KEY with a GPT API key. If a hassle, you can bug Adam for his."
  );
}

// Initialize the ChatGPTAPI with the provided API key and completion parameters
export const api = new ChatGPTAPI({
  apiKey: process.env.CHATGPT_API_KEY,
  completionParams: {
    model: "gpt-4",
  },
  maxModelTokens: 7192,
  maxResponseTokens: 1000,
});

// Set the remaining updates based on the environment variable
let remainingUpdates = process.env.CHATGPT_UPDATES
  ? +process.env.CHATGPT_UPDATES
  : 0;

/**
 * Extracts a snippet of text from the source code centered around the given position.
 * @param sourceCode The source code to extract the snippet from.
 * @param pos The position around which to center the snippet.
 * @returns An object containing the extracted snippet and the updated position.
 */
function extractSnippet(sourceCode: string, pos: number) {
  const maxLength = 7192 * 3;
  const halfLength = Math.floor(maxLength / 2);

  // If the source code is shorter than the maximum length,
  // return the entire source code and the original position
  if (sourceCode.length <= maxLength) {
    return { snippet: sourceCode, updatedPos: pos };
  }

  // Calculate the start and end positions of the snippet
  let start = pos - halfLength;
  let end = pos + halfLength;

  // Adjust the start and end positions if they are out of bounds
  if (start < 0) {
    end -= start;
    start = 0;
  }
  if (end > sourceCode.length) {
    const diff = end - sourceCode.length;
    start -= diff;
    end = sourceCode.length;
    if (start < 0) {
      start = 0;
    }
  }

  // Return the extracted snippet and the updated position
  return { snippet: sourceCode.substring(start, end), updatedPos: pos - start };
}

/**
 * Makes a request to the ChatGPT API to generate a comment for the given position in the source code.
 * @param sourceCode The source code to generate a comment for.
 * @param additionalPrompt An additional prompt to provide to the ChatGPT API.
 * @param pos The position in the source code to generate a comment for.
 * @returns A promise that resolves with the generated comment.
 */
async function makeChatGPTRequest(
  sourceCode: string,
  additionalPrompt: string,
  pos: number
): Promise<string> {
  const { snippet, updatedPos } = extractSnippet(sourceCode, pos);
  const prompt = `provide only insightful comment to replace the <comment here> tag at index ${updatedPos}. ${additionalPrompt}`;

  let writeLength = 0;

  const response = await api.sendMessage(prompt, {
    systemMessage: `work on this code:\n${snippet}`,
    onProgress(partialResponse) {
      const output = partialResponse.text;
      const newOutput = output.substring(writeLength);
      writeLength = output.length;
      process.stdout.write(newOutput);
    },
  });

  return response.text;
}

async function updateSourceFile(
  sourceFilePath: string,
  additionalPrompt: string
) {
  const sourceCode = fs.readFileSync(sourceFilePath).toString();
  const promiseQueue: Array<
    () => Promise<{ pos: number; doc: string } | null>
  > = [];
  let index = sourceCode.indexOf("<comment here>");

  while (index !== -1) {
    const currentIndex = index;
    promiseQueue.push(async () => {
      const doc = await makeChatGPTRequest(sourceCode, additionalPrompt, index);
      return { pos: currentIndex, doc: doc };
    });
    index = sourceCode.indexOf("<comment here>", index + 1);
    remainingUpdates++;
  }

  const docUpdates: Array<{ pos: number; doc: string }> = [];

  for (const p of promiseQueue) {
    if (remainingUpdates > 0) {
      const update = await p();
      if (update) {
        docUpdates.push(update);
        remainingUpdates--;
      }
    }
  }

  let updatedCode = sourceCode;
  let offset = 0;

  for (const update of docUpdates) {
    const { pos, doc } = update;
    const currentIndex = pos + offset;
    updatedCode =
      updatedCode.slice(0, currentIndex) +
      doc +
      updatedCode.slice(currentIndex + "<comment here>".length);
    offset += doc.length - "<comment here>".length;
  }

  fs.writeFileSync(sourceFilePath, updatedCode);
  console.log("DONE " + sourceFilePath);
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const commentAction = await new Promise<string>((resolve) => {
    rl.question(
      "Would you like to improve existing comments or add new comments? (improve/add) ",
      (answer) => {
        resolve(answer);
      }
    );
  });
  console.log(commentAction);
  if (commentAction === "add") {
    const additionalPrompt = await new Promise<string>((resolve) => {
      rl.question("Are there any additional prompts? ", (answer) => {
        resolve(answer);
        rl.close();
      });
    });

    for (const fileName of process.argv.slice(2)) {
      console.log("Considering " + fileName);
      await updateSourceFile(fileName, additionalPrompt);
    }
  } else if (commentAction === "improve") {
  } else {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

main();
