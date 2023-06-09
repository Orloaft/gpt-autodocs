import * as fs from "fs";
import * as readline from "readline";
import { ChatGPTAPI } from "chatgpt";

if (!process.env.CHATGPT_API_KEY) {
  throw new Error(
    "You need to set CHATGPT_API_KEY with a GPT API key. If a hassle, you can bug Adam for his."
  );
}

export const api = new ChatGPTAPI({
  apiKey: process.env.CHATGPT_API_KEY,
  completionParams: {
    model: "gpt-4",
  },
  maxModelTokens: 7192, // Must equal maxModelTokens + maxReponseTokens <= 8192
  maxResponseTokens: 1000,
});
let remainingUpdates = process.env.CHATGPT_UPDATES
  ? +process.env.CHATGPT_UPDATES
  : 0;
function extractSnippet(sourceCode: string, pos: number) {
  const maxLength = 7192 * 3;
  const halfLength = Math.floor(maxLength / 2);

  if (sourceCode.length <= maxLength) {
    return { snippet: sourceCode, updatedPos: pos };
  }

  let start = pos - halfLength;
  let end = pos + halfLength;

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

  return { snippet: sourceCode.substring(start, end), updatedPos: pos - start };
}
const promiseQueue: Array<() => Promise<{ pos: number; doc: string } | null>> =
  [];

async function makeChatGPTRequest(
  sourceCode: string,
  additionalPrompt: string,
  pos: number
): Promise<string> {
  const { snippet, updatedPos } = extractSnippet(sourceCode, pos);
  // Combine the default prompt with the additional prompt
  const prompt = `provide only insightful comment to replace the <comment here> tag at index${updatedPos}. ${additionalPrompt}`;
  let writeLength = 0;

  const response = await api.sendMessage(prompt, {
    systemMessage: `work on this code:${snippet}`,
    onProgress(partialResponse) {
      let output = partialResponse.text;
      let newOutput = output.substring(writeLength);
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
  // Pass the additionalPrompt argument to makeChatGPTRequest
  const sourceCode = fs.readFileSync(sourceFilePath).toString();
  promiseQueue.length = 0;
  let index: number = sourceCode.indexOf("<comment here>");
  while (index != -1) {
    let currentIndex = index;
    promiseQueue.push(async () => {
      const doc = await makeChatGPTRequest(sourceCode, additionalPrompt, index);
      return { pos: currentIndex, doc: doc };
    });
    index = sourceCode.indexOf("<comment here>", index + 1);
    remainingUpdates++;
  }

  const docUpdates: any[] = [];

  for (const p of promiseQueue) {
    if (remainingUpdates > 0) {
      const update = await p();
      if (update) {
        docUpdates.push(update);
        remainingUpdates--;
      }
    }
  }

  let updatedCode: string = sourceCode;
  let offset: number = 0;
  for (let i = 0; i < docUpdates.length; i++) {
    if (docUpdates[i]) {
      let index: number = docUpdates[i].pos + offset;
      updatedCode =
        updatedCode.slice(0, index) +
        docUpdates[i].doc +
        updatedCode.slice(index + "<comment here>".length);
      offset += docUpdates[i].doc.length - "<comment here>".length;
    }
  }

  fs.writeFileSync(sourceFilePath, updatedCode);
  console.log("DONE " + sourceFilePath);
}
async function main() {
  // Create a readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Prompt the user for an additional prompt
  const additionalPrompt = await new Promise<string>((resolve) => {
    rl.question("Are there any additional prompts? ", (answer) => {
      resolve(answer);
      rl.close();
    });
  });

  for (const fileName of process.argv.slice(2)) {
    console.log("considering " + fileName);
    // Use the function to update a TypeScript file
    await updateSourceFile(fileName, additionalPrompt);
  }
}
main();
