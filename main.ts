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
const MAX_CODE_CHUNK_SIZE = 5000; // Maximum size of each code chunk
async function makeChatGPTRequest(
  sourceCode: string,
  additionalPrompt: string
): Promise<string> {
  // Combine the default prompt with the additional prompt
  const prompt = `please generate a relevant comment for each <comment here> tag in provided code and return a re-written version of the code where each tag is replaced with the corresponding comment.Do not add any additional words before the code. ${additionalPrompt}`;
  let writeLength = 0;
  try {
    // Split the source code into smaller chunks
    const codeChunks: string[] = [];
    let chunkStart = 0;
    while (chunkStart < sourceCode.length) {
      const chunkEnd = Math.min(
        chunkStart + MAX_CODE_CHUNK_SIZE,
        sourceCode.length
      );
      const codeChunk = sourceCode.substring(chunkStart, chunkEnd);
      codeChunks.push(codeChunk);
      chunkStart = chunkEnd;
    }

    // Process each code chunk separately
    const responsePromises = codeChunks.map(async (chunk) => {
      const response = await api.sendMessage(prompt, {
        systemMessage: `this is the provided code:${chunk}`,
        onProgress(partialResponse) {
          let output = partialResponse.text;
          let newOutput = output.substring(writeLength);
          writeLength = output.length;
          process.stdout.write(newOutput);
        },
      });
      return response.text;
    });

    // Wait for all responses
    const responses = await Promise.all(responsePromises);

    // Concatenate the responses
    let annotatedCode = responses.join("");

    // Remove the introductory text
    const codeBlockMarker = "```";
    const languageMarkerIndex = annotatedCode.indexOf(codeBlockMarker);
    if (languageMarkerIndex !== -1) {
      const start = languageMarkerIndex + codeBlockMarker.length;
      annotatedCode = annotatedCode.substring(start);
    }

    return annotatedCode;
  } catch (error) {
    console.error("ChatGPT request failed:", error);
    return ""; // Return an empty string if the request fails
  }
}

async function updateSourceFile(
  sourceFilePath: string,
  additionalPrompt: string
) {
  // Pass the additionalPrompt argument to makeChatGPTRequest
  const sourceCode = fs.readFileSync(sourceFilePath).toString();
  const annotatedCode = await makeChatGPTRequest(sourceCode, additionalPrompt);
  fs.writeFileSync(sourceFilePath, annotatedCode);
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
