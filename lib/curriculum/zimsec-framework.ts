/**
 * TINAYE-HUB COPYRIGHT-SAFE ZIMSEC CURRICULUM FRAMEWORK
 * Original pedagogical competency framework covering Grades 1 through 7.
 * Abstracts syllabus learning goals into structured, procedurally renderable modules
 * without replicating copyrighted textbooks, exam past papers, or third-party media.
 */

export interface CurriculumTopicDefinition {
  gradeLevel: number;
  code: string;
  titleShona: string;
  titleEnglish: string;
  category: string;
  description: string;
  orderIndex: number;
  iconSvgName: string;
  competencies: Array<{
    code: string;
    nameShona: string;
    nameEnglish: string;
  }>;
  sampleLessons: Array<{
    title: string;
    slug: string;
    description: string;
    content: {
      introShona: string;
      rulesSummary: string[];
      dialogueSimulation?: {
        character: string;
        promptShona: string;
        options: Array<{
          id: string;
          textShona: string;
          isPoliteCulturalNorm: boolean;
          feedbackShona: string;
        }>;
      };
    };
    exercises: Array<{
      id: string;
      type: 'MULTIPLE_CHOICE' | 'DRAG_MATCH' | 'FILL_BLANK' | 'SENTENCE_ORDER' | 'DIALOGUE_BRANCH';
      questionShona: string;
      instructionsShona: string;
      targetCompetencyCode: string;
      payload: {
        promptAsset?: string;
        options?: string[];
        correctAnswer: string | string[];
        pairs?: Array<{ left: string; right: string }>;
      };
      socraticHints: string[];
    }>;
  }>;
}

export const ZIMSEC_SHONA_CURRICULUM: CurriculumTopicDefinition[] = [
  // =========================================================================
  // FOUNDATION TIER: GRADES 1 & 2 (Mavambo neMabhii)
  // Focus: Phonics, visual noun association, family, body parts, home animals
  // =========================================================================
  {
    gradeLevel: 1,
    code: 'G1-MABHII-01',
    titleShona: 'Mabhii eInzwi (Vowels)',
    titleEnglish: 'Vowel Phonics & Sound Association',
    category: 'PHONICS_MABHII',
    description: 'Kuziva inzwi re mabhii mashanu: a, e, i, o, u kuburikidza nemifananidzo.',
    orderIndex: 1,
    iconSvgName: 'alphabet',
    competencies: [
      { code: 'CMP-G1-VOWELS', nameShona: 'Kudanwa kweMabhii eInzwi', nameEnglish: 'Vowel Sound Pronunciation' },
      { code: 'CMP-G1-PHONICS-MATCH', nameShona: 'Kufananidza Inzwi neChinhu', nameEnglish: 'Sound to Object Association' }
    ],
    sampleLessons: [
      {
        title: 'Inzwi reMabhii: a, e, i, o, u',
        slug: 'g1-inzwi-remabhii',
        description: 'Dzidza madanirwo anoitwa mabhii eShona eInzwi.',
        content: {
          introShona: 'Mumutauro weChiShona tinayo mabhii mashanu anoti a, e, i, o, u. Ndiwo anopa mazwi ose inzwi rakanaka!',
          rulesSummary: [
            'A - somukuti "Amai" kana "Aka"',
            'E - somukuti "Enda" kana "Edza"',
            'I - somukuti "Imbwa" kana "Idya"',
            'O - somukuti "Ona" kana "Oma"',
            'U - somukuti "Uya" kana "Uswa"'
          ]
        },
        exercises: [
          {
            id: 'EX-G1-VOWEL-01',
            type: 'MULTIPLE_CHOICE',
            questionShona: 'Nderipi bhii rekutanga pashoko rinoti "Imbwa"?',
            instructionsShona: 'Sarudza bhii chairo rinotanga zita remhuka iyi.',
            targetCompetencyCode: 'CMP-G1-VOWELS',
            payload: {
              promptAsset: 'dog-illustration',
              options: ['a', 'e', 'i', 'o'],
              correctAnswer: 'i'
            },
            socraticHints: [
              'Chimbotaura shoko rekuti "Imbwa" zvishoma nezvishoma: "I-mbwa".',
              'Inzwi rekutanga rinonzwika serinobuda pane zita rekuti "Idya" kana "Ino".',
              'Bhii racho rakaita kamutsetse kakatwasuka kane kadonhwe pamusoro!'
            ]
          },
          {
            id: 'EX-G1-MATCH-01',
            type: 'DRAG_MATCH',
            questionShona: 'Katanidza bhii nechese rinomirira chinhu chacho:',
            instructionsShona: 'Dhonza bhii uise pamufananidzo wakafanira.',
            targetCompetencyCode: 'CMP-G1-PHONICS-MATCH',
            payload: {
              pairs: [
                { left: 'A', right: 'Amai (Mother)' },
                { left: 'I', right: 'Imbwa (Dog)' },
                { left: 'U', right: 'Uswa (Grass)' }
              ],
              correctAnswer: ['A:Amai', 'I:Imbwa', 'U:Uswa']
            },
            socraticHints: [
              'Tarisa mufananidzo wemukadzi ane mwana - uyo ndiAmai, anotanga na A.',
              'Tarisa huswa hwakasvibira huri pasi - hunotanga na U.'
            ]
          }
        ]
      }
    ]
  },
  {
    gradeLevel: 2,
    code: 'G2-NHENGO-01',
    titleShona: 'Nhengo dzeMuviri neMhuri',
    titleEnglish: 'Body Parts & Family Vocabulary',
    category: 'VOCABULARY_MAZWI',
    description: 'Kudoma nekunyora nhengo dzemuviri pamwe chete nehukama hwemhuri.',
    orderIndex: 2,
    iconSvgName: 'users',
    competencies: [
      { code: 'CMP-G2-BODY-PARTS', nameShona: 'Kuziva Nhengo dzeMuviri', nameEnglish: 'Body Parts Identification' },
      { code: 'CMP-G2-FAMILY-KIN', nameShona: 'Hukama hweMhuri', nameEnglish: 'Family Kinship Terms' }
    ],
    sampleLessons: [
      {
        title: 'Nhengo dzeMuviri Wedu',
        slug: 'g2-nhengo-dzemuviri',
        description: 'Kuziva mazita enhengo dzose dzinoshanda mumuviri.',
        content: {
          introShona: 'Muviri wedu une nhengo dzakasiyana-siyana dzine mabasa adzo anokosha.',
          rulesSummary: [
            'Meso - ekuona nawo',
            'Nzeve - dzekunzwa nadzo',
            'Mhuno - yekufema neyokunhuwidza nayo',
            'Maoko - ekubatisa nekushandisa mabasa',
            'Makumbo - ekufambisa'
          ]
        },
        exercises: [
          {
            id: 'EX-G2-BODY-01',
            type: 'MULTIPLE_CHOICE',
            questionShona: 'Nhengo ipi yemuviri yatinoshandisa kuteerera nziyo kana manzwi?',
            instructionsShona: 'Sarudza nhengo inoteerera.',
            targetCompetencyCode: 'CMP-G2-BODY-PARTS',
            payload: {
              options: ['Meso', 'Nzeve', 'Mhuno', 'Makumbo'],
              correctAnswer: 'Nzeve'
            },
            socraticHints: [
              'Funga kuti kana shamwari yako ichitaura newe, inzwi rinopinda papi?',
              'Meso anoshanda kuona, mhuno kufema. Ndedzipi dziri padivi pemusoro dzinonzwa?'
            ]
          }
        ]
      }
    ]
  },

  // =========================================================================
  // DEVELOPMENT TIER: GRADES 3 & 4 (Kukura neZviratidzo)
  // Focus: Noun classes (Mipanda 1-18), Ideophones (Nyaudzosingwi),
  // Verb tenses, Branching dialogue simulations ("Tinewe bots")
  // =========================================================================
  {
    gradeLevel: 3,
    code: 'G3-MIPANDA-01',
    titleShona: 'Mipanda yeMazwi 1 kusvika 4 (Mu- / Va- & Mu- / Mi-)',
    titleEnglish: 'Noun Classes 1 to 4: People & Trees/Objects',
    category: 'NOUN_CLASSES_MIPANDA',
    description: 'Kudzidza mupanda wekutanga newechipiri (vanhu) pamwe nemupanda 3 ne 4.',
    orderIndex: 3,
    iconSvgName: 'layers',
    competencies: [
      { code: 'CMP-G3-NOUN-CL1-2', nameShona: 'Mupanda 1 ne 2 (Mu-/Va-)', nameEnglish: 'Noun Classes 1 & 2 Concords' },
      { code: 'CMP-G3-NOUN-CL3-4', nameShona: 'Mupanda 3 ne 4 (Mu-/Mi-)', nameEnglish: 'Noun Classes 3 & 4 Concords' }
    ],
    sampleLessons: [
      {
        title: 'Mupanda 1 (Mu-) neMupanda 2 (Va-)',
        slug: 'g3-mupanda-1-ne-2',
        description: 'Sei tichiti "Mwana" muuzhinji opinduka kuva "Vana"?',
        content: {
          introShona: 'Mupanda 1 unosanganisira mazwi evanhu muushoma (somukuti "mukadzi", "murume", "mufundisi"). Mupanda 2 ndiwo uzhinji hwawo hunotanga na "Va-".',
          rulesSummary: [
            'Mupanda 1: Chivakashure "Mu-" (Mu-komana, Mu-sikana, Mu-rwere)',
            'Mupanda 2: Chivakashure "Va-" (Va-komana, Va-sikana, Va-rwere)',
            'Chirevo chinowirirana: "Mukomana mu-refu a-rikufamba" -> "Vakomana va-refu va-rikufamba".'
          ]
        },
        exercises: [
          {
            id: 'EX-G3-CL1-01',
            type: 'FILL_BLANK',
            questionShona: 'Shandura chirevo ichi kuuzhinji: "Mufudzi mukuru arara pasi."',
            instructionsShona: 'Nyora shoko rinopinda pachinzvimbo cheuzhinji.',
            targetCompetencyCode: 'CMP-G3-NOUN-CL1-2',
            payload: {
              correctAnswer: 'Vafudzi vakuru varara pasi'
            },
            socraticHints: [
              'Chivakashure cheMupanda 2 chinotanga na "Va-".',
              'Shoko rekuti "Mufudzi" rinoshanduka kuita chii kana vari vazhinji?',
              'Rangarira kuti zviratidzo zvose zvinotora "va-": Vafudzi va-kuru va-rara pasi.'
            ]
          }
        ]
      }
    ]
  },
  {
    gradeLevel: 4,
    code: 'G4-NYAUDZO-01',
    titleShona: 'Nyaudzosingwi neNhaurirano (Ideophones & Dialogue)',
    titleEnglish: 'Ideophones & Interactive Branching Cultural Dialogue',
    category: 'IDEOPHONES_NYAUDZOSINGWI',
    description: 'Kushandisa nyaudzosingwi dzekuita, dzemavara, nedzenzvimbo; kutaura zvine tsika.',
    orderIndex: 4,
    iconSvgName: 'message-circle',
    competencies: [
      { code: 'CMP-G4-IDEOPHONES', nameShona: 'Nyaudzosingwi dzeKuita neMavara', nameEnglish: 'Action & Color Ideophones' },
      { code: 'CMP-G4-CULTURAL-RESPECT', nameShona: 'Maitiro eChitendero neTsika kuVakuru', nameEnglish: 'Respectful Greeting Etiquette' }
    ],
    sampleLessons: [
      {
        title: 'Nhaurirano naTinewe: Kukwazisa Vakuru',
        slug: 'g4-nhaurirano-tinewe',
        description: 'Dzidza kukwazisa vanhu vakuru nemaitiro anoremekedzeka eChiShona.',
        content: {
          introShona: 'MuChiShona, hatikwazisi vakuru takatarisa kudenga kana takamira takazhambatata. Tinopfugama kana kuombera maoko tichiti "Maswera sei?".',
          rulesSummary: [
            'Kana wasangana naSekuru manheru, unoti: "Maswera sei Sekuru?"',
            'Sekuru vanopindura vachiti: "Ndaswera kana maswerawo."',
            'Kushandisa nyaudzosingwi kunovaraidza: Kusviba kwekuti "svindimana" kana "dzviti", kutsvuka "piriviri".'
          ],
          dialogueSimulation: {
            character: 'Sekuru Gumbo',
            promptShona: 'Wasangana naSekuru Gumbo padare vachidziya moto manheru. Unotanga nekuita sei?',
            options: [
              {
                id: 'OPT-1',
                textShona: 'Kupinda uchishevedzera kuti: "Madii henyu mudhara!"',
                isPoliteCulturalNorm: false,
                feedbackShona: 'Aiwa! Kudaidza munhu mukuru kuti "mudhara" kushaya tsika. Vakuru vanoremekedzwa.'
              },
              {
                id: 'OPT-2',
                textShona: 'Kufugama zvishoma, kuombera maoko tichiti: "Maswera sei Sekuru?"',
                isPoliteCulturalNorm: true,
                feedbackShona: 'Chitsidzo chakanaka kwazvo! Makorokoto, kuratidza tsika nehunhu hweChiShona.'
              }
            ]
          }
        },
        exercises: [
          {
            id: 'EX-G4-NYAUDZO-01',
            type: 'MULTIPLE_CHOICE',
            questionShona: 'Zuva rati _______ kudzika kumadokero, vanhu vose vakadzokera kumisha.',
            instructionsShona: 'Zadzisa gaka uchishandisa nyaudzosingwi yakakodzera.',
            targetCompetencyCode: 'CMP-G4-IDEOPHONES',
            payload: {
              options: ['bvoo', 'dhumbunyu', 'kutu', 'go'],
              correctAnswer: 'kutu'
            },
            socraticHints: [
              'Tarisa zvinoitika kana zuva rodoka: "kutu" kudzika.',
              '"Bvoo" inoshanda pakupinda mumvura. "Kutu" inoratidza kudzika kwezuva.'
            ]
          }
        ]
      }
    ]
  },

  // =========================================================================
  // MASTERY TIER: GRADES 5, 6 & 7 (Hunyanzvi hweZvirungamutauro)
  // Focus: Zvirungamutauro, Madimikira (Idioms), Tsumo (Proverbs),
  // Synthesized original reading comprehension passages
  // =========================================================================
  {
    gradeLevel: 6,
    code: 'G6-MADIMIKIRA-01',
    titleShona: 'Madimikira neZvirungamutauro (Idioms & Figurative Shona)',
    titleEnglish: 'Idiomatic Mastery & Linguistic Ornaments',
    category: 'IDIOMS_MADIMIKIRA',
    description: 'Kududzira nekushandisa madimikira anorunga mutauro weChiShona muzvinyorwa.',
    orderIndex: 5,
    iconSvgName: 'sparkles',
    competencies: [
      { code: 'CMP-G6-IDIOMS-DEEP', nameShona: 'Kududzira Madimikira', nameEnglish: 'Idiom Interpretation & Application' },
      { code: 'CMP-G6-TSUMO-PARALLEL', nameShona: 'Kufananidza Tsumo Dzakafanana', nameEnglish: 'Parallel & Opposing Proverbs' }
    ],
    sampleLessons: [
      {
        title: 'Madimikira eMusoro neMwoyo',
        slug: 'g6-madimikira-musoro-mwoyo',
        description: 'Madimikira anoshandisa nhengo dzomuviri kureva zvakadzama.',
        content: {
          introShona: 'Madimikira inzira yokutaura mashoko anoreva zvakasiyana nezviri pamazwi ari pachena. Anorunga kutaura kuti kuyevedze.',
          rulesSummary: [
            '"Kubata kumeso" - kureva kunyengedza mumwe munhu.',
            '"Kurova guva" - kuyeuka mufi maererano netsika dzevatema.',
            '"Kupa gotsi" - kureva kutiza kana kuramba kuteerera mumwe.',
            '"Kuchema mhuka ine mavara" - kusuwa kana kudemba chinhu chawaona kukosha kwacho chashaikwa.'
          ]
        },
        exercises: [
          {
            id: 'EX-G6-MADIM-01',
            type: 'MULTIPLE_CHOICE',
            questionShona: 'Mutengesi akatora mari yemwana ndokumupa chingwa chakaora. Mutengesi uyu akaita sei kumwana?',
            instructionsShona: 'Sarudza dimikira rinodudzira zvaitwa nomutengesi.',
            targetCompetencyCode: 'CMP-G6-IDIOMS-DEEP',
            payload: {
              options: ['Akamupa gotsi', 'Akamubata kumeso', 'Akarova guva', 'Akagura manhenga'],
              correctAnswer: 'Akamubata kumeso'
            },
            socraticHints: [
              'Mutengesi akanyengedza mwana nokuti mwana haana kuziva.',
              'Funga nezvedimikira rinoreva "kunyengera munhu chiso nechiso".',
              'Dimikira chairo ndi "Kubata kumeso".'
            ]
          }
        ]
      }
    ]
  },
  {
    gradeLevel: 7,
    code: 'G7-TSUMO-NHAURWA-01',
    titleShona: 'Tsumo Dzakadzama neNhaurwa dzeKupedzisira (ZIMSEC Exam Synthesis)',
    titleEnglish: 'Advanced Proverbs, Analysis & Synthetic Comprehension',
    category: 'PROVERBS_TSUMO',
    description: 'Tsumo dzine tsinhirano, dzinopikisana, uye ongororo yenhaurwa dzechinyakare.',
    orderIndex: 6,
    iconSvgName: 'award',
    competencies: [
      { code: 'CMP-G7-COMPREHENSION', nameShona: 'Kunzwisisa Nhaurwa neKupindura Mibvunzo', nameEnglish: 'Critical Text Comprehension' },
      { code: 'CMP-G7-PROVERB-SYNTHESIS', nameShona: 'Tsumo Dzinopikisana neDzinotsinhira', nameEnglish: 'Proverb Synthesis & Context' }
    ],
    sampleLessons: [
      {
        title: 'Tsumo neMashandisirwo Adzo',
        slug: 'g7-tsumo-dzakadzama',
        description: 'Dzidza tsumo dzinotsinhirana nedzinopikisana.',
        content: {
          introShona: 'Vakuru vakati: "Tsumo mutsara unotakura hungwaru hwevakuru". Imwe tsumo inogona kutsigira imwe, asi imwe inogonawo kuratidza rumwe rutivi rwehupenyu.',
          rulesSummary: [
            'Tsumo dzinotsinhira: "Chara chimwe hachitswanyi inda" inoenderana na "Rume rimwe harikombi churu".',
            'Tsumo dzinopikisana: "Kutsva kwendebvu varume vanodzimurana" inopikisana na "Mwoyo muti unomera paunoda".'
          ]
        },
        exercises: [
          {
            id: 'EX-G7-TSUMO-01',
            type: 'MULTIPLE_CHOICE',
            questionShona: 'Ndeipi tsumo inotevera inoreva zvakafanana netsumo yokuti: "Chara chimwe hachitswanyi inda"?',
            instructionsShona: 'Sarudza tsumo inotsinhira kukosha kwekushandira pamwe.',
            targetCompetencyCode: 'CMP-G7-PROVERB-SYNTHESIS',
            payload: {
              options: [
                'Rume rimwe harikombi churu',
                'Kandiro kanoenda kunobva kamwe',
                'Aive madziva ave mazambuko',
                'Mwana asingachemi anofira mumbereko'
              ],
              correctAnswer: 'Rume rimwe harikombi churu'
            },
            socraticHints: [
              'Tsumo yekutanga inotaura nezvemunhu mumwe chete asingakwanise kuita basa rose ari oga.',
              'Tarisa tsumo inotaura nezvemumwe murume anoedza kukomba churu chihombe ega.',
              'Tsumo inotsinhira ndi: "Rume rimwe harikombi churu".'
            ]
          }
        ]
      }
    ]
  }
];
