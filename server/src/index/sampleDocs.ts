/**
 * @fileoverview Sample documents for testing the search engine.
 * 
 * These documents are used to test the inverted index and search functionality.
 * They cover various programming topics for realistic testing.
 * 
 * @module index/sampleDocs
 */

/**
 * Array of sample documents for testing the search engine.
 * 
 * Each document represents a programming tutorial or guide.
 * 
 * @example
 * const firstDoc = sampleDocs[0];
 * console.log(firstDoc.title); // "Python Tutorial"
 */
export const sampleDocs = [
  {
    id: "1",
    title: "Python Tutorial",
    content:
      "Python is a great programming language for beginners. It is easy to learn and has simple syntax.",
  },
  {
    id: "2",
    title: "JavaScript Guide",
    content:
      "JavaScript is the language of the web. It runs in browsers and can be used for frontend and backend development.",
  },
  {
    id: "3",
    title: "React Basics",
    content:
      "React is a JavaScript library for building user interfaces. It uses components and virtual DOM for efficient rendering.",
  },
  {
    id: "4",
    title: "Node.js Introduction",
    content:
      "Node.js allows JavaScript to run on the server. It uses the V8 engine and is great for building APIs and microservices.",
  },
  {
    id: "5",
    title: "TypeScript Features",
    content:
      "TypeScript adds static typing to JavaScript. It helps catch errors early and improves code maintainability.",
  },
];
