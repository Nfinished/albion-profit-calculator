import { ResponseModel, Item } from './profit-tree/typeDefs'

/**
 * Define type of item: journal, item, artifact, resource etc.
 * 
 * @param itemName resource or artifact name: T4_PLANK, T7_ARTEFACT_MAIN_SPEAR_KEEPER etc.
 * @returns array with all tiers and subtiers for this item
 */
export function createArrayOfAllIngredients(itemName: string): string[] {
  let allItems = [];
  let resources = ['PLANKS', 'CLOTH', 'METALBAR', 'LEATHER', 'STONE'];

  if (isArtifact(itemName)) {
    allItems = createArrayOfAllArtifactsFromArtifact(itemName);
  } else if (resources.some(res => itemName.includes(res))) {
    allItems = createStringOfAllResources(itemName.slice(3)).split(',');
  } else if (itemName.includes('JOURNAL')) {
    allItems = createStringOfAllJournals(`ROOT_${itemName.slice(11)}`).split(',');
  } else {
    allItems = createStringOfAllItems(itemName).split(',');
  }

  return allItems;
}

/**
 * Creates a string to request for items of all tiers and subtiers
 * 
 * @param itemName - item name: T4_2H_NATURESTAFF_KEEPER etc.
 * @returns string with all tiers and subtiers for item
 */
export function createStringOfAllItems(itemName: string): string {
  let allNames = '';

  for (let subtier = 0; subtier <= 3; subtier++) {
    for (let tier = 4; tier <= 8; tier++) {
      allNames = allNames + `T${tier}` + itemName.slice(2) + (subtier != 0 ? `@${subtier}` : '') + ',';
    }
  }

  return allNames.slice(0, -1);
}

/**
 * Creates a string to request for materials of all tiers and subtiers
 * 
 * @param resource - basic resource: PLANKS, CLOTH etc.
 * @returns string with all tiers and subtiers for materials
 */
export function createStringOfAllResources(resource: string): string {
  let allNames = '';

  for (let subtier = 0; subtier <= 3; subtier++) {
    for (let tier = 4; tier <= 8; tier++) {
      allNames = allNames + `T${tier}_` + resource + (subtier != 0 ? `_LEVEL${subtier}@${subtier}` : '') + ',';
    }
  }

  return allNames.slice(0, -1);
}

/**
 * Creates a string to request for artefacts of all tiers
 * 
 * @param itemName - artefact item name: T4_2H_NATURESTAFF_KEEPER etc.
 * @returns string with all tiers for artefacts
 */
export function createStringOfAllArtifacts(itemName: string) {
  let allNames = '';

  if (itemName.includes('ROYAL')) {
    for (let tier = 4; tier <= 8; tier++) {
      allNames = allNames + `QUESTITEM_TOKEN_ROYAL_T${tier},`;
    }

    return allNames.slice(0, -1);
  }

  if (itemName.includes('INSIGHT')) {
    allNames = allNames + `T4_SKILLBOOK_STANDARD,`;

    return allNames.slice(0, -1);
  }

  for (let tier = 4; tier <= 8; tier++) {
    allNames = allNames + `T${tier}_ARTEFACT${itemName.slice(2)},`;
  }

  return allNames.slice(0, -1);
}


/**
 * Creates an array to request for artefacts of all tiers
 * 
 * @param itemName - artefact item name: T4_ARTEFACT_2H_NATURESTAFF_KEEPER etc.
 * @returns array with all tiers for artefacts
 */
export function createArrayOfAllArtifactsFromArtifact(artifactName: string) {
  let allNames = [];

  if (artifactName.includes('ROYAL')) {
    for (let tier = 4; tier <= 8; tier++) {
      allNames.push(`QUESTITEM_TOKEN_ROYAL_T${tier}`);
    }

    return allNames;
  }

  if (artifactName.includes('SKILLBOOK')) {
    allNames.push(`T4_SKILLBOOK_STANDARD`);

    return allNames;
  }

  for (let tier = 4; tier <= 8; tier++) {
    allNames.push(`T${tier}${artifactName.slice(2)}`);
  }

  return allNames;
}

/**
 * Creates a string to request for empty and full journals of all tiers and subtiers
 * 
 * @param root - journals branch: ROOT_WARRIOR etc.
 * @returns string with all tiers and subtiers for empty and full journals
 */
export function createStringOfAllJournals(root: string): string {
  let allNames = '';

  for (let tier = 4; tier <= 8; tier++) {
    allNames = allNames + `T${tier}_JOURNAL_${root.slice(5)}_EMPTY,`;
    allNames = allNames + `T${tier}_JOURNAL_${root.slice(5)}_FULL,`;
  }

  return allNames.slice(0, -1);
}

/**
 * Minimum price from sales orders or maximum price from purchase orders
 * 
 * @param {ResponseModel} item 
 */
export function normalizedPriceAndDate(item: ResponseModel): Item {
  const previousDay = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const sellPriceRespone = {
    price: item.sellPriceMin,
    date: item.sellPriceMinDate,
    marketFee: 4.5,
    quality: item.quality
  }

  const buyPriceResponse = {
    price: item.buyPriceMax,
    date: item.buyPriceMaxDate,
    marketFee: 3,
    quality: item.quality
  }

  if (item.sellPriceMin != 0 && item.buyPriceMax == 0) {
    return sellPriceRespone
  }

  if (item.sellPriceMin == 0 && item.buyPriceMax != 0) {
    return buyPriceResponse;
  }

  if (item.sellPriceMin == 0 && item.buyPriceMax == 0) {
    return buyPriceResponse;
  }

  if (new Date(item.sellPriceMinDate) >= previousDay && new Date(item.buyPriceMaxDate) <= previousDay) {
    return sellPriceRespone;
  }

  if (new Date(item.sellPriceMinDate) <= previousDay && new Date(item.buyPriceMaxDate) >= previousDay) {
    return buyPriceResponse;
  }

  // Compare prices with fee,
  if (item.buyPriceMax * 0.97 > item.sellPriceMin * 0.955) {
    return buyPriceResponse;
  }

  return sellPriceRespone;
}

/**
 * Normalize previous item and new item by date and price
 * 
 * @param oldItem - previous item
 * @param newItem - new item 
 */
export function normalizeItem(oldItem: Item, newItem: Item) {
  const previousDay = new Date(Date.now() - 24 * 60 * 60 * 1000);

  if (new Date(oldItem.date) >= previousDay && new Date(newItem.date) <= previousDay) {
    return oldItem;
  } else if (new Date(oldItem.date) <= previousDay && new Date(newItem.date) >= previousDay) {
    return newItem;
  }

  return oldItem.price > newItem.price ? oldItem : newItem;
}

/**
 * Checking an object for emptiness
 * 
 * @param obj - any object
 */
export function isObjectEmpty(obj: object): boolean {
  return JSON.stringify(obj) == "{}";
}

/**
 * Looking for an artifact substring in an item name
 * 
 * @param itemName - item name: T4_HEAD_CLOTH_HELL etc.
 */
export function isArtifactItem(itemName: string): boolean {
  const artifacts = ['UNDEAD', 'KEEPER', 'HELL', 'MORGANA', 'AVALON', 'ROYAL', "INSIGHT"];

  if (!itemName) {
    return false;
  }

  return artifacts.some(artifact => itemName.includes(artifact));
}

/**
 * Looking for an artifact substring in an item name
 * 
 * @param itemName - item name: T4_ARTEFACT_HEAD_CLOTH_HELL etc.
 */
export function isArtifact(itemName: string): boolean {
  const artifactSubstrings = ['ARTEFACT', 'SKILLBOOK'];

  return artifactSubstrings.some(substring => itemName.includes(substring));
}