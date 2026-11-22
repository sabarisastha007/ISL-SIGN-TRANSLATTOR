// Vocabulary of the prototype. To add a word: add an entry here, a gesture in gestureMap.js
// (for the heuristic recognizer) and an animation in signMappings.js (for the avatar).
export const SIGN_WORDS = [
  { id: 'HELLO', ta: 'வணக்கம்', aliases: { en: ['HI', 'HEY'], ta: ['வணக்கம்'] } },
  { id: 'HELP', ta: 'உதவி', aliases: { en: ['ASSIST'], ta: ['உதவி'] } },
  { id: 'THANK YOU', ta: 'நன்றி', aliases: { en: ['THANKS', 'THANKYOU'], ta: ['நன்றி', 'நன்றிகள்'] } },
  { id: 'SORRY', ta: 'மன்னிக்கவும்', aliases: { en: ['APOLOGY'], ta: ['மன்னிக்கவும்', 'மன்னிப்பு'] } },
  { id: 'YES', ta: 'ஆம்', aliases: { en: ['OK', 'OKAY'], ta: ['ஆம்', 'ஆமாம்'] } },
  { id: 'NO', ta: 'இல்லை', aliases: { en: ['NOPE'], ta: ['இல்லை', 'வேண்டாம்'] } },
  { id: 'WATER', ta: 'தண்ணீர்', aliases: { ta: ['தண்ணீர்', 'நீர்'] } },
  { id: 'FOOD', ta: 'உணவு', aliases: { en: ['EAT', 'MEAL'], ta: ['உணவு', 'சாப்பாடு'] } },
  { id: 'PLEASE', ta: 'தயவுசெய்து', aliases: { ta: ['தயவுசெய்து', 'தயவு'] } },
  { id: 'EMERGENCY', ta: 'அவசரம்', aliases: { ta: ['அவசரம்'] } },
  { id: 'I', ta: 'நான்', aliases: { en: ['ME'], ta: ['நான்', 'எனக்கு'] } },
  { id: 'YOU', ta: 'நீங்கள்', aliases: { en: ['YOUR'], ta: ['நீங்கள்', 'நீ', 'உனக்கு'] } },
  { id: 'MY', ta: 'என்', aliases: { ta: ['என்', 'எனது'] } },
  { id: 'NAME', ta: 'பெயர்', aliases: { ta: ['பெயர்'] } },
  { id: 'NEED', ta: 'வேண்டும்', aliases: { en: ['WANT'], ta: ['வேண்டும்'] } },
  { id: 'IS', ta: '', aliases: { ta: ['ஆகும்'] } },
];
