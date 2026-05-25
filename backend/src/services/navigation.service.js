import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load campus data JSON (ES module safe way)
const require = createRequire(import.meta.url);
const campusData = require("../data/campusdata.json");

//  KEYWORD MAP 
const keywordMap = {
  "library":               "tagore_library",
  "tagore library":        "tagore_library",
  "reading hall":          "reading_hall",

  "account office":        "account_office",
  "information center":    "information_center",
  "pithvi hall":           "pithvi_hall",

  "square one":            "square_one",
  "nursing block":         "nursing_block",
  "resto u":               "resto_u",
  "boys mess":             "boys_mess",

  "bose girls hostel":     "bose_girls_hostel",
  "bose boys hostel":      "bose_boys_hostel",
  "bose hostel":           "bose_girls_hostel",

  "aryabhatta":            "aryabhatta_hostel",
  "chanakya":              "chanakya_hostel",
  "sarabhai":              "sarabhai_hostel",

  "kalpana hostel":        "kalpana_hostel",
  "girls mess":            "girls_mess",

  "gamma zone":            "gamma_zone",
  "chai nagri":            "chai_nagri",

  "explore hub":           "explore_hub",
  "beta zone":             "beta_zone",

  "florence hall":         "florence_hall",

  "chenab hall":           "chenab_hall",
  "tuck shop":             "tuck_shop",
  "makers lab":            "makers_lab",
  "international affairs": "international_affairs",

  "shivalik hall":         "shivalik_hall",

  // Extra aliases for common misspellings / short forms
  "admin block":           "account_office",
  "admin":                 "account_office",
  "tuckshop":              "tuck_shop",
  "chaiagri":              "chai_nagri",
  "chainagri":             "chai_nagri",
};

const normalizeText = (text) => text.toLowerCase().trim();

//  DESTINATION DETECTOR 
const detectDestination = (message) => {
  const msg = normalizeText(message);
  for (const key in keywordMap) {
    if (msg.includes(key)) {
      return keywordMap[key];
    }
  }
  return null;
};

//  BFS PATH FINDER 
const findPath = (start, destination, locations) => {
  const queue = [[start]];
  const visited = new Set();

  while (queue.length > 0) {
    const path = queue.shift();
    const node = path[path.length - 1];

    if (node === destination) return path;

    if (!visited.has(node)) {
      visited.add(node);

      // Guard: node might not exist in the map
      if (!locations[node] || !locations[node].routes) continue;

      const routes = locations[node].routes;
      for (const nextDest in routes) {
        const nextNode = routes[nextDest].next;
        if (!visited.has(nextNode)) {
          queue.push([...path, nextNode]);
        }
      }
    }
  }
  return null;
};

//  MAIN EXPORT 
export const getDirections = (message) => {
  const destination = detectDestination(message);
  const locations = campusData.locations;

  if (!destination || !locations[destination]) {
    return {
      steps: [
        {
          instruction:
            "Sorry, I couldn't find that location. Try asking about: Library, Admin Block, Girls Mess, Sarabhai, Nursing Block, Chenab Hall, or Tuck Shop.",
          image: null,
        },
      ],
    };
  }

  const start = campusData.startPoint;
  const path = findPath(start, destination, locations);

  if (!path) {
    return {
      steps: [
        {
          instruction: "No route found to that location from the main entrance.",
          image: null,
        },
      ],
    };
  }

  const steps = [];

  for (let i = 0; i < path.length - 1; i++) {
    const current = path[i];
    const next = path[i + 1];

    const currentNode = locations[current];
    if (!currentNode) continue;

    const routes = currentNode.routes;
    let instruction = "Move forward";

    for (const key in routes) {
      if (routes[key].next === next) {
        instruction = routes[key].instruction;
        break;
      }
    }

    steps.push({
      instruction,
      image: currentNode.image ? `/images/${currentNode.image}` : null,
    });
  }

  // Final arrival step
  steps.push({
    instruction: `You have arrived at ${locations[destination].name}.`,
    image: locations[destination].image
      ? `/images/${locations[destination].image}`
      : null,
  });

  return { steps };
};
