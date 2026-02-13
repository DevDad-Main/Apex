function tokenizer(input: string) {
  const output = input.replace(/'/, "");
  return output.toLowerCase().match(/[a-zA-Z]+/g) || [];
}

console.log(tokenizer("Hello World! How's it going?"));
