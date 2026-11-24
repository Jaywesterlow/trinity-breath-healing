/**
 * Client reviews for /reviews, verbatim as Marvin e-mailed them on behalf of the three
 * writers (17 Nov 2026), with Brigitte confirming on WhatsApp that he sent them. First
 * names only. Two are in English and stay in English; `lang` marks them for screen
 * readers and search engines. Blocks of kind "heading" are the subheadings in Ragne's
 * text. The one edit: "prive" restored to "privé" (the accents were lost on the way).
 */
export interface ReviewBlock {
	kind: 'heading' | 'paragraph';
	text: string;
}

export interface Review {
	id: string;
	name: string;
	lang: 'nl' | 'en';
	title: string;
	subtitle: string | null;
	blocks: readonly ReviewBlock[];
}

export const REVIEWS: readonly Review[] = [
	{
		id: 'ero',
		name: 'Ero',
		lang: 'en',
		title: "Finally, peace of mind and a good night's sleep",
		subtitle: "My personal experience with Brigitte's Mahatma & Gold Healing treatments",
		blocks: [
			{
				kind: 'paragraph',
				text: "For a long time, I've struggled with stress, an overactive mind and difficulty sleeping. My days are often filled with pressure, worries and constant thoughts, making it difficult to truly relax, even at night. I rarely slept deeply and couldn't remember the last time I had a proper dream. Over the years, I've tried several different treatments to find some relief, but unfortunately, none of them really made a difference."
			},
			{
				kind: 'paragraph',
				text: "Then I discovered Brigitte and her Mahatma & Gold Healing treatments. What immediately appealed to me was that the treatments could be done entirely remotely, from the comfort of my own home. I was curious but didn't really know what to expect."
			},
			{
				kind: 'paragraph',
				text: 'The results genuinely surprised me.'
			},
			{
				kind: 'paragraph',
				text: "After my first treatment, I felt an immediate sense of calm. My mind was quieter, my body felt relaxed, and that night I slept deeply. What impressed me even more was that this wasn't just a temporary feeling. The positive effects lasted for approximately one to two weeks. During that time, I experienced noticeably less stress, more peace in both my mind and body, and a much deeper, more restful sleep."
			},
			{
				kind: 'paragraph',
				text: "And something unexpected happened: I started dreaming again! Something I hadn't experienced in a very long time."
			},
			{
				kind: 'paragraph',
				text: "After about one to two weeks, the familiar feelings of stress and mental pressure gradually began to return. Having experienced such a positive difference, I didn't hesitate to book another session."
			},
			{
				kind: 'paragraph',
				text: "On the evening of my second treatment, I had been drinking alcohol and initially preferred to postpone it. After discussing it with Brigitte, she encouraged me to go ahead with the session. And once again, I was amazed by the experience. That night, I slept so deeply that I actually overslept and was late for work the next morning! Normally, my dog wakes me up, but even he seemed unusually relaxed. During the treatment, he had settled down near my head and stayed there peacefully. I sometimes joke that perhaps Brigitte's treatment worked on my dog as well!"
			},
			{
				kind: 'paragraph',
				text: "What I appreciate most about Brigitte is her calm, caring and reassuring approach. She takes the time to listen, makes you feel comfortable and genuinely cares about how you're doing."
			},
			{
				kind: 'paragraph',
				text: "I can't explain exactly how these treatments work, but I can honestly say that I've experienced a level of relaxation, mental clarity and deep sleep that I hadn't been able to achieve with other treatments."
			},
			{
				kind: 'paragraph',
				text: "I'm now exploring which of Brigitte's other treatments I would like to try next."
			},
			{
				kind: 'paragraph',
				text: 'For anyone struggling with stress, an overactive mind or difficulty relaxing, I can wholeheartedly recommend giving Brigitte a chance.'
			},
			{
				kind: 'paragraph',
				text: 'Thank you, Brigitte, for helping me rediscover what real rest feels like.'
			}
		]
	},
	{
		id: 'ragne',
		name: 'Ragne',
		lang: 'en',
		title: 'Finding peace, balance and the space to reconnect with myself',
		subtitle:
			"My personal experience with Brigitte's Mahatma & Gold Healing, Cranio Unwinding Fascia and Clearing treatments",
		blocks: [
			{
				kind: 'paragraph',
				text: "For quite some time, I had been dealing with a lot of stress, an overactive mind and constant pressure in my daily life. There was always something to think about, something to worry about or something that needed my attention. Even when I tried to relax, my mind and body simply wouldn't switch off."
			},
			{
				kind: 'paragraph',
				text: 'My sleep was poor, often disturbed by unpleasant dreams, and I rarely woke up feeling truly rested. Looking back, I realise that I had become so used to living with stress that I almost forgot what it felt like to be genuinely relaxed.'
			},
			{
				kind: 'paragraph',
				text: "That's when I started my treatments with Brigitte."
			},
			{
				kind: 'heading',
				text: 'My first experience: Mahatma & Gold Healing'
			},
			{
				kind: 'paragraph',
				text: 'I began with three Mahatma & Gold Healing sessions, all performed remotely.'
			},
			{
				kind: 'paragraph',
				text: "To be honest, I was quite sceptical at first. How could a treatment work when the therapist wasn't even physically present?"
			},
			{
				kind: 'paragraph',
				text: 'But what I experienced genuinely surprised me.'
			},
			{
				kind: 'paragraph',
				text: 'After each session, I fell asleep almost immediately. My mind became quieter, my body felt more relaxed, and I started sleeping deeply and peacefully again.'
			},
			{
				kind: 'paragraph',
				text: 'What made the biggest difference was that the sense of calm stayed with me. I noticed that repeating the treatment every two to three weeks helped me maintain that feeling of balance.'
			},
			{
				kind: 'paragraph',
				text: 'During those weeks, something else began to change. Because I was finally experiencing some peace and sleeping properly, I found myself able to think more clearly. I started gaining insights into what was really going on in my life, what was causing my stress and what I needed to change.'
			},
			{
				kind: 'paragraph',
				text: "The treatments didn't just help me relax. They gave me the breathing space I needed to start taking steps forward."
			},
			{
				kind: 'paragraph',
				text: 'Another wonderful advantage of the remote sessions was their simplicity. No travelling, no appointments outside my home and no need for anyone to come over. I could simply lie down somewhere comfortable, give myself half an hour of peace and allow the experience to unfold.'
			},
			{
				kind: 'paragraph',
				text: 'Absolutely wonderful!'
			},
			{
				kind: 'heading',
				text: 'The next step: Cranio Unwinding Fascia'
			},
			{
				kind: 'paragraph',
				text: 'After my three remote healing sessions, I continued with two Cranio Unwinding Fascia treatments.'
			},
			{
				kind: 'paragraph',
				text: 'For such a long time, my body had been functioning under constant stress and pressure. As I began to relax, I became more aware of how much tension and exhaustion I had been carrying. I experienced headaches, discomfort around my neck and other little aches, but above all, I felt incredibly tired.'
			},
			{
				kind: 'paragraph',
				text: 'Brigitte came to my home for these treatments, which was another thing I really appreciated.'
			},
			{
				kind: 'paragraph',
				text: "I simply lay on my back while she worked gently with her hands around my body. The whole experience felt calm and peaceful. And the best part? When the treatment was finished, I didn't have to get up, get dressed and travel anywhere. I could just stay where I was and continue resting."
			},
			{
				kind: 'paragraph',
				text: 'I noticed a difference after the very first session. The aches and discomfort started to ease, and gradually my energy began to return.'
			},
			{
				kind: 'paragraph',
				text: 'But something quite remarkable happened immediately afterwards.'
			},
			{
				kind: 'paragraph',
				text: 'For the next three days, I allowed myself to do something I had almost forgotten how to do: simply rest and sleep whenever I needed to.'
			},
			{
				kind: 'paragraph',
				text: 'No constant thoughts about what I should be doing. No pressure to get things done. No feeling that I had to keep going.'
			},
			{
				kind: 'paragraph',
				text: 'For once, I listened to my body and gave myself permission to rest, simply because I wanted to and because I felt that I needed it.'
			},
			{
				kind: 'paragraph',
				text: 'That was an important experience for me.'
			},
			{
				kind: 'paragraph',
				text: 'After my second Cranio Unwinding Fascia treatment, I noticed even more improvement. My body felt increasingly relaxed, the discomfort continued to decrease, and I gradually felt less exhausted.'
			},
			{
				kind: 'heading',
				text: 'Continuing the journey with Clearing'
			},
			{
				kind: 'paragraph',
				text: 'More recently, I also had a Clearing session.'
			},
			{
				kind: 'paragraph',
				text: 'Brigitte recommended this as a natural next step after my previous treatments, with the intention of creating even more space, clarity and peace within myself.'
			},
			{
				kind: 'paragraph',
				text: 'And that brings me to something I particularly appreciate about working with her.'
			},
			{
				kind: 'paragraph',
				text: "Brigitte doesn't simply offer individual treatments. She listens, observes how you respond and helps you find the next step that feels right for you."
			},
			{
				kind: 'paragraph',
				text: "I tell her what I'm experiencing, we start with what needs attention first, and then we look at the results together before deciding how to continue."
			},
			{
				kind: 'paragraph',
				text: 'There is no pressure, no rushing and no feeling that everything needs to be solved at once.'
			},
			{
				kind: 'paragraph',
				text: "I also love the fact that I can receive these different treatments from one person. Someone who knows my story, understands what I've been going through and follows my progress along the way."
			},
			{
				kind: 'heading',
				text: 'From sceptical to genuinely grateful'
			},
			{
				kind: 'paragraph',
				text: "If someone had told me beforehand that remote healing sessions could make such a difference to how I felt, I probably wouldn't have believed them."
			},
			{
				kind: 'paragraph',
				text: 'But having experienced these treatments myself, my perspective has completely changed.'
			},
			{
				kind: 'paragraph',
				text: "I can't explain exactly how everything works, and I don't feel that I need to. What matters is what I've personally experienced: deeper sleep, less physical discomfort, more relaxation, greater mental clarity and, perhaps most importantly, the ability to listen to myself again."
			},
			{
				kind: 'paragraph',
				text: 'For anyone who feels overwhelmed by stress, struggles to relax or simply feels that their mind and body need a moment to breathe, I can wholeheartedly recommend Brigitte.'
			},
			{
				kind: 'paragraph',
				text: "Thank you, Gitte, for your warmth, your patience and your thoughtful guidance. You've helped me find something I didn't realise I had been missing for so long: genuine peace, both inside and out."
			}
		]
	},
	{
		id: 'marvin',
		name: 'Marvin',
		lang: 'nl',
		title: 'Van overleven naar weer echt leven - mijn persoonlijke ervaring met Brigitte',
		subtitle: null,
		blocks: [
			{
				kind: 'paragraph',
				text: 'Ik ben iemand die altijd druk is. Zakelijk, privé, eigenlijk is er altijd wel iets dat mijn aandacht vraagt. Daarnaast heb ik de afgelopen jaren zowel zakelijk als privé een behoorlijk vervelende periode doorgemaakt. Een periode waarvan de gevolgen tot op de dag van vandaag soms nog merkbaar zijn. Het vervelende was vooral dat ik steeds dacht: nu heb ik alles geregeld, nu kan ik eindelijk verder. En vervolgens gebeurde er weer iets waardoor alles opnieuw begon. Weer een probleem, weer iets wat op te lossen, weer iets wat energie kostte. Op een gegeven moment merk je dat dit niet alleen in je hoofd gaat zitten, maar ook in je lichaam. Ik heb in die periode hulp gezocht bij twee psychologen. Hoewel ik daar zeker iets van heb meegenomen, hebben zij voor mij uiteindelijk niet het verschil kunnen maken waar ik naar op zoek was.'
			},
			{
				kind: 'paragraph',
				text: 'Via Brigitte ben ik vervolgens begonnen met verschillende behandelingen. En als ik nu terugkijk op dat hele traject, kan ik oprecht zeggen dat iedere behandeling mij op zijn eigen manier een stap verder heeft gebracht. Niet alleen om rust te vinden, maar vooral om weer richting te krijgen in mijn leven.'
			},
			{
				kind: 'paragraph',
				text: 'Ik ben begonnen met vier Mahatma & Gold Healing behandelingen op afstand.'
			},
			{
				kind: 'paragraph',
				text: 'En mijn eerste ervaring was meteen bijzonder. Bij de eerste afspraak was er namelijk een misverstand tussen Brigitte en mij over het tijdstip van de behandeling. Daardoor had de behandeling al plaatsgevonden, terwijl ik zelf niet eens doorhad dat we begonnen waren! Toch merkte ik diezelfde avond direct verschil. Ik voelde rust in mijn lichaam en sliep die nacht ontzettend diep. Dat vond ik opmerkelijk, juist omdat ik niet bewust met de behandeling bezig was geweest. Na de tweede behandeling gebeurde er iets wat ik eigenlijk al heel lang niet meer had gedaan: ik heb drie dagen vrijwel alleen maar geslapen en gerust. Ik legde mijn telefoon weg, liet mijn werkzaamheden even voor wat ze waren en gaf mezelf eindelijk de tijd om naar mijn vermoeidheid te luisteren. Zonder schuldgevoel, zonder voortdurend te denken aan alles wat nog moest gebeuren. Gewoon rust nemen omdat mijn lichaam daar behoefte aan had.'
			},
			{
				kind: 'paragraph',
				text: 'Dat klinkt misschien heel normaal, maar voor iemand zoals mij, die altijd doorgaat, was dat een enorme stap. Na de eerste twee behandelingen merkte ik dat ik daadwerkelijk rust begon te ervaren. Tegelijkertijd realiseerde ik me dat ik daar zelf nog te weinig bij stilstond. Ik voelde het verschil, maar ging vervolgens toch weer door met de dagelijkse dingen. Vanaf dat moment ben ik ook bewust aan de slag gegaan met wat er met mij gebeurde. Niet alleen de behandelingen ondergaan, maar ook echt kijken naar mijn gedrag, mijn gedachten en de manier waarop ik met situaties omging. Daarna volgden nog twee Mahatma & Gold Healing behandelingen.'
			},
			{
				kind: 'paragraph',
				text: 'Het mooie was dat ik tijdens deze laatste twee behandelingen in het buitenland verbleef, terwijl Brigitte gewoon in Nederland was.'
			},
			{
				kind: 'paragraph',
				text: 'Het werkt dus zelfs overseas! ;-)'
			},
			{
				kind: 'paragraph',
				text: 'Dat vind ik nog steeds een van de grote voordelen van deze behandelingen. Je hoeft nergens naartoe, je kunt gewoon in je eigen vertrouwde omgeving blijven en jezelf even de tijd gunnen om tot rust te komen. Of je nu in Nederland bent of aan de andere kant van de wereld.'
			},
			{
				kind: 'paragraph',
				text: 'Na deze vier behandelingen heb ik bij mij thuis een Cranio Unwinding Fascia behandeling gehad.'
			},
			{
				kind: 'paragraph',
				text: 'Inmiddels was ik me veel bewuster geworden van de spanning die ik lange tijd met me had meegedragen. Door de eerdere behandelingen en doordat ik zelf actief met mijn ervaringen bezig was, begon er al veel te veranderen. De Cranio Unwinding Fascia behandeling voelde voor mij als een mooie volgende stap. Na deze behandeling merkte ik dat er nog meer rust in mijn lichaam kwam. Maar misschien nog belangrijker: ik begon ook weer zin te krijgen in dingen. Ik kreeg weer behoefte om te sporten, gezonder te eten en beter naar mijn lichaam te luisteren. Niet omdat het moest, maar omdat ik het zelf wilde. En dat laatste is voor mij een wezenlijk verschil. Ik ben gewend om mezelf voortdurend taken en verplichtingen op te leggen. Er moet altijd iets gebeuren, er moet altijd iets worden afgerond. Langzaam begon ik te begrijpen dat niet alles moet en dat ik zelf mag bepalen wat op welk moment belangrijk is.'
			},
			{
				kind: 'paragraph',
				text: 'Vervolgens adviseerde Brigitte mij een Rasterhealing behandeling.'
			},
			{
				kind: 'paragraph',
				text: 'Hoewel ik inmiddels veel meer rust en richting in mijn leven ervaarde, merkte ik dat bepaalde situaties me nog steeds behoorlijk konden raken. Soms gebeurde er iets waardoor ik ineens een rotgevoel kreeg. En soms wist ik niet eens precies waar dat gevoel vandaan kwam. Wat ik misschien nog wel het meest bijzonder vond, was dat ik na lange tijd eindelijk weer echte geluksmomenten begon te ervaren. Momenten waarop ik gewoon blij was, zonder dat daar een specifieke aanleiding voor hoefde te zijn.'
			},
			{
				kind: 'paragraph',
				text: 'Ik had eigenlijk niet verwacht dat er dan toch nog situaties konden ontstaan waardoor ik tijdelijk een terugval zou ervaren. Daar heb ik uitgebreid met Brigitte over gesproken. Zij legde mij uit dat zulke momenten niet vreemd zijn en volgens haar juist onderdeel kunnen zijn van het proces waarin je zit. Dat je niet ineens alles achter je hebt gelaten omdat je je beter voelt, maar dat het er vooral om gaat hoe je met nieuwe situaties omgaat. En toen zei ze iets wat mij tot op de dag van vandaag is bijgebleven:'
			},
			{
				kind: 'paragraph',
				text: '"Je bent er pas als jij de situatie bepaalt, en niet de situatie jou."'
			},
			{
				kind: 'paragraph',
				text: 'Zo simpel. Zo logisch. En tegelijkertijd voor mij zo ontzettend waardevol.'
			},
			{
				kind: 'paragraph',
				text: 'Want dat is precies waar het om gaat. Er zullen altijd vervelende situaties blijven ontstaan. Het leven is nu eenmaal hectisch en je kunt niet alles voorkomen of controleren. Maar je kunt wel leren hoe je ermee omgaat, hoeveel invloed je iets op jezelf laat hebben en of je toestaat dat een situatie opnieuw je rust wegneemt. Dat inzicht heeft voor mij echt een verschil gemaakt.'
			},
			{
				kind: 'paragraph',
				text: 'Ik sta inmiddels weer goed in het leven. Niet omdat alle problemen verdwenen zijn, maar omdat ik er anders mee omga. Ik ben me bewuster geworden van mezelf, mijn grenzen en wat ik nodig heb. Wat ik daarnaast bijzonder waardeer, is dat het contact met Brigitte niet ophoudt zodra een behandeling is afgelopen. Als ik iets ervaar, ergens tegenaan loop of bepaalde gevoelens niet direct kan plaatsen, bespreek ik dat met haar.'
			},
			{
				kind: 'paragraph',
				text: 'Zelfs mijn dromen. Want ook dat is iets wat veranderd is: ik droom weer, sinds lange tijd. Sommige dromen zijn bijzonder en roepen vragen bij me op. Wanneer ik die met Brigitte bespreek, helpt zij mij om ze te bekijken in het licht van de ontwikkelingen die ik doormaak. Hetzelfde geldt voor bepaalde gevoelens en ervaringen die gedurende mijn traject naar boven komen. Wat ik mooi vind, is dat ik hierdoor steeds beter begrijp wat er bij mij speelt. Dingen die ik eerder niet goed kon plaatsen, krijgen langzaam meer betekenis.'
			},
			{
				kind: 'paragraph',
				text: 'Mijn meest recente behandeling was een sessie met de Biotensor.'
			},
			{
				kind: 'paragraph',
				text: 'Ook dat was voor mij weer een bijzondere ervaring. Tijdens deze behandeling heeft Brigitte ontzettend veel vragen met mij besproken. Vragen over mijn lichaam, hoe ik me voel, mijn staat van zijn en zelfs over waar ik vandaan kom. Ik kreeg inzichten en antwoorden waar ik eerder niet bij had stilgestaan. Sommige daarvan waren voor mij verrassend, andere voelden juist heel logisch toen ik ze besprak. Het bijzondere was dat hierdoor opnieuw verschillende puzzelstukjes op hun plek vielen. Zaken die ik eerder niet met elkaar in verband bracht, begonnen voor mij meer samenhang te krijgen. En daarmee ben ik weer een stap verder gekomen in mijn persoonlijke proces.'
			},
			{
				kind: 'paragraph',
				text: 'Wat Brigitte voor mij zo bijzonder maakt, is dat zij niet zomaar een behandeling uitvoert en het daarbij laat.'
			},
			{
				kind: 'paragraph',
				text: 'Ze luistert naar wat er speelt, kijkt samen met mij naar wat een behandeling heeft gebracht en adviseert vervolgens welke volgende stap passend zou kunnen zijn.'
			},
			{
				kind: 'paragraph',
				text: 'Iedere behandeling heeft voor mij een eigen betekenis gehad. De ene bracht vooral lichamelijke rust, de andere gaf mij ruimte om na te denken en weer een andere hielp mij om bepaalde gevoelens en ervaringen beter te begrijpen. Maar uiteindelijk hebben ze allemaal bijgedragen aan hetzelfde: dat ik weer dichter bij mezelf ben gekomen. Ik kan niet precies uitleggen hoe iedere behandeling werkt. Wat ik wel weet, is wat ik zelf heb ervaren en hoeveel verschil dit traject voor mij heeft gemaakt.'
			},
			{
				kind: 'paragraph',
				text: 'En dat is ook de reden waarom ik inmiddels verschillende vrienden en familieleden naar Brigitte heb doorverwezen. Sterker nog, bij mensen die aanvankelijk sceptisch waren, heb ik zelfs de eerste behandeling cadeau gedaan. Gewoon omdat ik ze de mogelijkheid wilde geven om zelf te ervaren wat het voor hen zou kunnen betekenen.'
			},
			{
				kind: 'paragraph',
				text: 'Ik ben ontzettend blij met wat de behandelingen mij hebben gebracht. En het doet me goed dat ook anderen die ik naar Brigitte heb doorgestuurd positieve ervaringen hebben opgedaan.'
			},
			{
				kind: 'paragraph',
				text: 'Als ik terugkijk op waar ik vandaan kom en waar ik nu sta, is het grootste verschil misschien wel dat ik niet meer voortdurend het gevoel heb dat ik moet overleven, oplossen en doorgaan.'
			},
			{
				kind: 'paragraph',
				text: 'Ik heb weer rust in mijn hoofd en lichaam. Ik kan weer genieten van kleine dingen, ervaar opnieuw geluksmomenten en ben me veel bewuster van de keuzes die ik maak.'
			},
			{
				kind: 'paragraph',
				text: 'Natuurlijk gebeuren er nog steeds vervelende dingen. Maar ik weet nu dat ik daar zelf anders mee om kan gaan.'
			},
			{
				kind: 'paragraph',
				text: 'En misschien is dat wel het mooiste wat dit hele traject mij heeft gebracht:'
			},
			{
				kind: 'paragraph',
				text: 'Ik laat niet langer alles wat er om mij heen gebeurt bepalen hoe ik mij vanbinnen voel. Ik pak zelf weer de regie over mijn leven.'
			},
			{
				kind: 'paragraph',
				text: 'Dank je wel, Gitte. Voor je betrokkenheid, je geduld, je inzichten en vooral voor de manier waarop je mij hebt begeleid.'
			},
			{
				kind: 'paragraph',
				text: 'Je hebt mij op een heel bijzondere manier geholpen om mijn rust, richting en levensplezier terug te vinden.'
			},
			{
				kind: 'paragraph',
				text: 'Thxxx a million, Gitte!'
			}
		]
	}
];
