const Processor = require('./processor').Processor;

class Prompt extends Processor {
  constructor() {
    super('prompt');
    this.outputQueueName = 'reply';
    this.loroWisdom = [
      "A velocidade da luz é mais rápida do que a da escuridão.",
      "Se você tentar falhar e conseguir, falhou em falhar.",
      "O tempo voa, mas os relógios não têm asas.",
      "Nunca corra com uma tesoura, a menos que esteja participando de uma maratona de cortadores de papel.",
      "Por que o esqueleto não brigou com ninguém? Porque ele não tem estômago para isso!",
      "O que o tomate disse para o pepino? Você é um pepino.",
      "Qual é o animal mais antigo? A zebra, porque está em preto e branco desde sempre.",
      "Por que o livro de matemática está sempre estressado? Porque tem muitos problemas.",
      "Se o dinheiro falasse, o meu diria 'adeus'.",
      "A paciência é uma virtude, mas também é o que dizem quando estão presos no trânsito.",
      "Se a prática leva à perfeição, e ninguém é perfeito, por que praticar?",
      "A única coisa que aprendemos com a história é que nunca aprendemos com a história.",
      "Por que o peixe é tão bem educado? Porque nada de braçada!",
      "O que aconteceu com o pássaro que não queria compartilhar? Ficou sozinho.",
      "Como o esqueleto liga para os amigos? Pela telefonia esquelética.",
      "Por que o lápis não pode ser o detetive? Porque ele sempre perde o traço.",
      "Quem semeia vento pode ficar gripado.",
      "Onde quer que você esteja você sempre estará lá.",
      "Por que o vinho suave não é chamado de suavinho?",
      "Para bom... meia basta.",
      "Por que 'tudo junto' se escreve separado e 'separado' se escreve tudo junto?",
      "Um é pouco, dois é bom e três é ímpar.",
      "O POVO UNIDO... é gente pra caramba!",
      "É tudo questão de ponto de vista. Perder é como ganhar de trás para frente.",
      "O unicórnio roxo sempre dança em cima do arco-íris, mas nunca encontra o pote de ouro.",
      "Se a vida te der limões, cuidado para não espirrar suco no olho.",
      "A vida é como um buraco negro: sempre sugando tudo à sua volta, mas nunca cheia.",
      "Mas vale um pássaro na mão do que água mole, pedra dura.",
      "Às vezes, a vida parece uma grande pizza, com muitos ingredientes diferentes, mas nunca o suficiente queijo.",
      "Viver é escrever sem borracha, sem corretivo, sem uma folha nova, com um fiscal de prova avisando que o tempo está passando.",
      "A vida é como uma bicicleta: você só cai quando tenta andar sem as mãos.",
      "No restaurante da vida, eu ando queimando até o miojo.",
      "Crescer é como ter um jardim: você precisa regar, adubar e ter todos os cuidados, até eventualmente perceber que prefere morar num apartamento.",
      "Algo de errado não está certo.",
      "Diz-me com quem andas, que te direi que estou com preguiça de sair de casa.",
      "A vida é como um jogo de tabuleiro, mas as regras são escritas em chinês antigo.",
      "Quem ri por último talvez esteja só fingindo ter entendido a piada.",
      "Mais vale tarde do que muito tarde.",
      "Qualquer idiota é capaz de pintar um quadro, mas somente um gênio é capaz de vendê-lo.",
      "À beira de um precipício só há uma maneira de andar para a frente: é dar um passo atrás.",
      "Na geladeira da vida, eu preciso descongelar o congelador todos os dias e o sorvete sempre é feijão.",
      "Eu cavo, tu cavas, ele cava, nós cavamos, vós cavais, eles cavam. Esse pensamento nem precisou ser bonito para ser profundo.",
      "Palavras podem ser como um cobertor que te aconchega ou um faca que te fere, mas eu não sou bom nem de fazer a cama nem de cozinhar.",
      "Meu problema é que eu falei 'quero ser herdeiro' e Deus entendeu 'guerreiro'.",
      "Meus amigos sempre me falam que sou muito do contra, mas eu não concordo.",
      "Precisamos marcar logo o próximo compromisso que vamos cancelar.",
      "Vou te dar um conselho. Depois você me conta o que aconteceu quando você não o seguiu.",
      "Minha vida sem meus amigos seria como uma colcha de retalhos sem os tecidos, a linha de costura e a costureira.",
      "Os amigos são o presente que o passado nos dá para que tenhamos um futuro com o presente de poder relembrar o passado.",
      "Que raiva quando meus amigos falam bem na hora em que eu estou interrompendo.",
      "Meu amigos já me conhecem, sou prevenido e prefiro acordar cedo para me atrasar com calma.",
      "O mais importante na vida não é ter dinheiro, é ter amigos que entendem que você não tem e não te chamam para fazer coisas caras.",
      "Dou sempre bons conselhos aos meus amigos: evite acidentes, faça de propósito!",
      "Minha amiga me mandou alguns artigos com técnicas para ser uma pessoa menos esquecida. Mas eu esqueci de ver.",
      "Todos os meus amigos falam que eu sou um excelente exemplo a não ser seguido.",
      "Escolher amigos é como escolher um carro: você quer algo que seja confiável, seguro e que te leve a lugares legais. Mas meu carro vive dando quebrando no meio a estrada.",
      "Tem sempre aquele amigo que planeja a viagem toda nos mínimos detalhes e aquele cuja única responsabilidade era imprimir as passagens e sempre esquece. Eles geralmente viajam juntos.",
      "A vida é uma viagem. Alguns amigos são as asas para voarmos, outros são as malas para carregarmos.",
      "Na estrada da vida, meu carro acaba quebrando e meu amigo não sabe trocar pneu.",
      "Dou ótimos conselhos, só não sigo nenhum deles como meus amigos.",
      "Amigo é coisa para se guardar... ou para se deixar livre mesmo, cada um tem sua vida.",
      "O sonho acabou! Mas meus amigos estão trazendo uns brigadeiros.",
      "O pior cego é o que não seus amigos gritando 'Abaixa! Olha o galho!'",
      "Num relacionamento, o importante é o que importa.",
      "O casamento é a principal razão de qualquer divórcio.",
      "O cravo brigou com a rosa, mas a rosa não leva desaforo para casa e acabou com o cravo.",
      "Batatinha quando nasce esparrama pelo chão. Como fui eu que fiz a bagunça, minha namorada mandou eu limpar.",
      "Amigos, amigos, namorados à parte.",
      "De amor em amor, eu continuo solteiro.",
      "Minha mãe disse que eu deveria sempre ouvir o amor da minha vida, agora ela fica chateada porque eu faço perguntas ao meu videogame.",
      "Meu namorado mandou eu escolher entre ele e o gato. Enfim, me vê um saco de ração, que acabou a comida do bichano.",
      "Os primeiros cinco dias depois do final de semana são os mais difíceis.",
      "Eu nunca esqueço um rosto, mas para o seu terei que abrir uma exceção.",
      "Eu não plantei tudo isso que eu estou colhendo. Sabotaram a minha horta!",
      "Quem disse “o que os olhos não veem, o coração não sente” nunca perdeu uma barata de vista dentro do quarto.",
      "Não sair de casa e ir para a cama cedo: meus castigos de infância viraram meus objetivos de vida.",
      "As pessoas falam que trabalhar não faz mal a ninguém, mas eu não estou a fim de me arriscar.",
      "O que homens e rímel têm em comum? Os dois desaparecem ao primeiro sinal de emoção.",
      "Fazer nada é difícil, porque você nunca sabe quando vai terminar.",
      "Se você casasse comigo, a gente poderia viver uma vida de milionários(as) juntos(as). Pena que meu salário não colabora.",
      "Sim, eu repito roupa. Na minha casa, tem água e sabão.",
      "Às vezes olho para o meu passado e penso: “que coragem, porque noção não tinha nenhuma”.",
      "E aquela vontade de ser trouxa e acreditar na pessoa que diz que está conversando só comigo?",
      "Oi? Estou escutando, sim, só estou ignorando o que você está dizendo.",
      "Tem amizade que vale a pena, mas você, amiga, vale a galinha inteira!",
      "Eu sou tão desorganizado que perco coisas que nem sabia que tinha.",
      "Tudo bem que dinheiro não traz felicidade, mas eu prefiro ser infeliz em Paris.",
      "Sou tão sedentário que, se por acaso me vir correndo, sai correndo também porque deve ser um assalto.",
      "Eu costumava achar que era indeciso, agora, eu já não sei se sou.",
      "Eu não dei sorte com as minhas esposas. A primeira, me largou; a segunda, não.",
      "Quem diz que dormiu como um bebê em uma boa noite de sono, definitivamente, não tem filho.",
      "Minha carteira parece uma cebola: tenho vontade de chorar sempre que abro.",
      "Dinheiro nem sempre é bom. Às vezes, ele é ótimo e, em outras, é maravilhoso.",
      "Metade de mim é namastê, a outra metade é namastreta.",
      "A vida é bela, a gente é que estraga ela.",
      "Não se preocupe: se o plano A não funcionar, você ainda tem letras para tentar.",
      "Se as pessoas falarem de você pelas costas, simplesmente solte um pum.",
      "Lembre-se de que, assim como todo mundo, você é único(a).",
      "Não tenha vergonha de quem você é, isso é culpa dos seus pais.",
      "Aquele que acorda primeiro, boceja o dia inteiro.",
      "Tudo passa. Nem que seja por cima de você, mas passa.",
      "Ter a consciência tranquila é um claro sinal de problema de memória.",
      "Quando as pessoas disserem que vai se arrepender de algo pela manhã, durma até o meio-dia.",
      "Desistir é para fracos. Por isso que prefiro nem tentar.",
      "Não desista devido às derrotas de hoje. Amanhã tem mais.",
      "Vamos amar o próximo, porque o(a) anterior a gente já sabe que não deu certo.",
      "São tantos os dias de luta que estou querendo me matricular no judô.",
      "Se você se acha muito pequeno(a) para fazer a diferença, tente dormir com um mosquito no quarto.",
      "Pior do que perder o sono de madrugada é encontrá-lo pela manhã.",
      "Não deixe que nada te desanime, afinal, até um pé na bunda te empurra para a frente.",
      "Café existe para as pessoas poderem odiar seus trabalhos com entusiasmo.",
      "Se a vida está fácil, provavelmente você está fazendo alguma coisa de errado.",
      "Paciência é igual dinheiro: não tenho e, quando tenho, vai embora rápido.",
      "Jesus te ama. Já todos os outros te acham um(a) grande idiota.",
      "Eu acho que vou fazer um chá de bebê para mim, porque, claramente, tem gente que acha que eu nasci ontem.",
      "Deus disse para a minha mãe: “desce e reclama!”.",
      "Se você está lendo isso…. É porque você sabe ler. Parabéns!",
      "Eu não te dei o dedo do meio, você conquistou.",
      "Se a pessoa que você gosta não te quer, vem cá que eu quero.",
      "Sexta é a minha segunda palavra preferida com S.",
      "Não tem problema você não gostar de mim, nem todo mundo tem bom gosto mesmo.",
      "Bom senso é como desodorante: aqueles que mais precisam nunca usam.",
      "Eu sou um ninguém. Ninguém é perfeito. Eu sou perfeito(a) :)",
      "Eu não acredito em signos, como todo bom sagitariano.",
      "A beleza está nos olhos de quem vê – e, sim, eu ainda te acho feio(a).",
      "Tudo bem não entender matemática, mas não entender a química que rola entre nós já é demais.",
      "Sinto que deveria estudar, mas prefiro deitar e esperar passar.",
      "A gente tem muito em comum: você respira, eu também…",
      "Quando me dizem “você está sumido(a)”, minha vontade é de responder “e vou continuar”.",
      "Minha capacidade de fingir interesse está temporariamente indisponível. Tente mais tarde (ou não!).",
      "Duas coisas que não me faltam: vontade de emagrecer e fome o dia inteiro.",
      "Eu sempre fui pobre, mas, neste mês, estou de parabéns!",
      "Se lembra de quando eu pedi a sua opinião? Não? Pois é, nem eu!",
      "Até a bateria do meu celular dura mais do que o amor eterno de alguns casais.",
      "Tudo que eu gosto é caro, engorda ou visualiza e não responde.",
      "Eu sou tão lindo que, quando eu nasci, o médico me jogou para cima e falou: “se voar, é anjo”.",
      "Me desculpem pelas mensagens que enviei ontem, meu celular estava bêbado.",
      "Nunca julgue um livro pelo filme.",
      "Não me diga que o céu é o limite se já deixaram pegadas na lua.",
      "Quem ri por último, não entendeu a piada.",
      "O banco é um lugar que vai te emprestar dinheiro se você provar que não precisa.",
      "Toda regra tem uma exceção. Esta regra não é exceção.",
      "Querida Matemática, cresça e resolva seus problemas sozinha.",
      "Deus fez o mundo. Mas todas as outras coisas são feitas na China.",
      "Enquanto os outros discutem se o copo está meio cheio ou meio vazio, eu prefiro beber a água.",
      "Você não odeia pessoas que respondem às próprias perguntas? Eu odeio!",
      "Se procrastinação fosse uma arte, eu seria o Picasso.",
      "Eu sou multitarefa: consigo procrastinar várias coisas ao mesmo tempo.",
      "Agente junto é erro de português, mas a gente separado é erro do destino.",
      "Crianças no banco de trás do carro podem gerar acidentes. Acidentes no banco de trás do carro podem gerar crianças.",
      "Eu sou super a favor da ironia, mas desejar “bom dia” já é ir longe demais.",
      "Se você acha que ninguém se importa com você estar vivo, deixe de pagar algumas contas e verá.",
      "O 'não' eu já tenho, agora só falta a humilhação.",
      "Não é raiva, é fome.",
      "Dessa água beberei e me afogarei.",
      "Oi, meu nome é Alceu. Alceu Dispor.",
      "Você é como asma: tira o meu fôlego.",
      "Eu não sou esquecido(a), tenho uma memória seletiva.",
      "Paciência é uma virtude, mas eu não quero esperar.",
      "Sinta-se em casa, a louça suja fica ali.",
      "Dormir é grátis, o que custa é levantar.",
      "Eu não tenho vergonha na cara, tenho só beleza mesmo.",
      "O bom de ser pobre é não ter amigo(a) interesseiro(a).",
      "Se sou bom partido, imagina inteiro?!",
      "Se eu fosse você, gostaria de ser eu mesmo(a).",
      "A internet é a única que cai e ninguém acha graça.",
      "Hoje eu acordei cedo para poder me atrasar com calma.",
      "Esperar pelo inesperado torna o inesperado esperado?",
      "Eu aplaudi porque terminou, não porque eu gostei.",
      "Desculpe o atraso, é que eu não queria vir.",
      "Não sou preguiçoso(a), só ativei o modo de economia de energia.",
      "Eu sou calmo, as pessoas é que me irritam.",
    ]
  }

  async connect() {
    await super.connect();
    await this.channel.assertQueue(this.outputQueueName, {durable: true});
    this.log(`Got queue ${this.outputQueueName}`);
  }

  consumer(message) {
    try {
      const zapMsg = JSON.parse(message.content.toString());

      const isNotMedia = !(Object.keys(zapMsg.mediaData).length > 0);
      const typeIsChat = zapMsg.type === 'chat';
      const hasBody = !!zapMsg.body;
      const matchesRegex = hasBody && !!zapMsg.body.toLowerCase().match(/loro+\b/);
      
      const isPrompt = typeIsChat && isNotMedia && hasBody && matchesRegex
      
      if (!isPrompt) {
        const reason = {
          isNotMedia: isNotMedia,
          typeIsChat: typeIsChat,
          hasBody: hasBody,
          matchesRegex: matchesRegex,
          id: zapMsg.id
        }
        this.log(`Message rejected. Reason: ${JSON.stringify(reason)}`);
        this.channel.ack(message);
      } else {
        this.log(`Message accepted: ${zapMsg.body}`);
        
        let wisdom = this.chooseWisdom();
        this.log(`Sharing '${wisdom}'`);
        this.reply({
          to: this.resolveDestination(zapMsg),
          content: wisdom,
          reply_to: zapMsg.id
        });
        
        this.channel.ack(message);
      }
    
    } catch (error) {
      console.log('Eita', error);
    }
  }

  reply(response) {
    this.channel.sendToQueue(this.outputQueueName, Buffer.from(JSON.stringify(response)), {persistent: true});
  }

  chooseWisdom() {
    return this.loroWisdom[Math.floor(Math.random() * this.loroWisdom.length)];
  }

  resolveDestination(zapMsg) {
    let destination = zapMsg.from;
  
    if (zapMsg.isGroupMsg && conf.validGroups.includes(zapMsg.groupInfo.id)) {
      destination = zapMsg.groupInfo.id;
    }
  
    if (zapMsg.fromMe) {
      destination = zapMsg.to;
    }
  
    return destination;
  }
}

const prompt = new Prompt();

process.on('SIGTERM', () => {
  prompt.log('SIGTERM signal received.');
  prompt.terminate();
});

try {
  prompt.connect().then(
    () => prompt.register()
  );
  
} catch (error) {
  prompt.terminate();
}
