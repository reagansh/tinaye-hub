/**
 * COMPASSIONATE SOCRATIC HINT ENGINE (SHONA PEDAGOGY)
 * Provides progressive, encouraging guidance in natural Shona
 * without giving away answers immediately.
 */

export interface SocraticHintRequest {
  questionShona: string;
  userAnswer: string;
  correctAnswer: string | string[];
  competencyCode?: string;
  category?: string;
  currentHintLevel: number; // 0 = first nudge, 1 = intermediate guidance, 2 = deep clue
  staticHints?: string[];
}

export interface SocraticHintResponse {
  hintShona: string;
  encouragementShona: string;
  nextHintLevel: number;
  hasMoreHints: boolean;
}

const ENCOURAGEMENTS_SHONA = [
  'Wanga uri pedyo zvikuru! Usakanda mapfumo pasi.',
  'Edza zvakare mwanangu, kudzidza kunoda moyo murefu.',
  'Pfungwa yakanaka, asi chimbozvitarisa neimwe nzira.',
  'Makorokoto nekuedza! Chiverenga chirevo ichi zvakare zvishoma nezvishoma.',
  'Gamba harityi kuedza! Funga zvataurwa nezvazvo pachidzidzo.'
];

export function generateSocraticHint(req: SocraticHintRequest): SocraticHintResponse {
  const { currentHintLevel, staticHints = [], category } = req;
  const encouragement =
    ENCOURAGEMENTS_SHONA[currentHintLevel % ENCOURAGEMENTS_SHONA.length];

  // 1. If static curated hints are provided by the curriculum author, yield them progressively
  if (staticHints.length > 0 && currentHintLevel < staticHints.length) {
    const hintShona = staticHints[currentHintLevel];
    return {
      hintShona,
      encouragementShona: encouragement,
      nextHintLevel: currentHintLevel + 1,
      hasMoreHints: currentHintLevel + 1 < staticHints.length,
    };
  }

  // 2. Rule-based procedural hints based on Shona linguistic categories
  let dynamicHint = 'Chimbodzokorora kuverenga chirevo ichi nokungwarira.';

  if (category === 'NOUN_CLASSES_MIPANDA') {
    if (currentHintLevel === 0) {
      dynamicHint = 'Tarisa chivakashure (prefix) chiri kutanga shoko racho. Nderipi bhii kana mavara ari kutanga?';
    } else if (currentHintLevel === 1) {
      dynamicHint = 'Mupanda wega-wega une zviratidzo zvawo. Kana riri shoko reushoma, mupanda weuzhinji unotora chivakashure chakasiyana.';
    } else {
      dynamicHint = 'Tarisa kuyanana kwemazwi muchirevo (concordial agreement): chivakashure chiri pachirevo chinofanira kuenderana.';
    }
  } else if (category === 'IDEOPHONES_NYAUDZOSINGWI') {
    if (currentHintLevel === 0) {
      dynamicHint = 'Nyaudzosingwi inoridza mhere yezviitiko kana kupa ruvara rwechinhu.';
    } else {
      dynamicHint = 'Funga nezvechiito: Mvura inoti "bvoo", asi zuva rinoti "kutu" kudzika.';
    }
  } else if (category === 'IDIOMS_MADIMIKIRA') {
    if (currentHintLevel === 0) {
      dynamicHint = 'Rangarira kuti dimikira harireve zvariri kutaura pamazwi pachena; rine chirevo chakavanzika.';
    } else {
      dynamicHint = 'Funga nezvetsika kana manzwiro anobuditswa nezviito zvemukati: kunyengera, kutya, kana rudo.';
    }
  } else if (category === 'PROVERBS_TSUMO') {
    if (currentHintLevel === 0) {
      dynamicHint = 'Tsumo iyi inoburitsa chidzidzo chei? Mushandirapamwe, kungwara, kana kuteerera vakuru?';
    } else {
      dynamicHint = 'Tarisa tsumo ine chidzidzo chakafanana: chimiro chevanhu vari pamwe chete vachikurukura.';
    }
  }

  return {
    hintShona: dynamicHint,
    encouragementShona: encouragement,
    nextHintLevel: currentHintLevel + 1,
    hasMoreHints: currentHintLevel < 3,
  };
}
