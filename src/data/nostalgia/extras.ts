import type { ExtraGroup } from '../../types';

/** 老物件博物馆的扩展分组：零食、动画片、广告语、游戏机、电器、校园…… */
export const extraGroups: ExtraGroup[] = [
  {
    id: 'snacks',
    title: '小卖部零食',
    subtitle: '五毛钱能买到的快乐，包装纸都舍不得扔。',
    items: [
      { name: '大大卷', year: 1990, description: '一拉能拉出很长一条泡泡糖，盒子里还送小玩具，比谁吹得大。', tag: '五毛' },
      { name: '麦丽素', year: 1990, description: '巧克力豆，被我们当成「仙丹」在课间互喂，吃完嘴唇一圈黑。', tag: '仙丹' },
      { name: '无花果丝', year: 1985, description: '一毛钱一袋，酸酸甜甜，吃完手指黏黏的，袋底还要舔干净。', tag: '一毛' },
      { name: '冰袋', year: 1995, description: '冻成冰的汽水袋，一毛钱一袋，上课偷偷含在嘴里，化了喝一口。', tag: '夏天' },
      { name: '小浣熊干脆面', year: 1998, description: '不为面，为了里面那张水浒卡。为了集卡，能跟同学换到翻脸。', tag: '集卡' },
      { name: 'AD 钙奶', year: 1996, description: '「甜甜的酸酸的」，一小瓶插根吸管，一口气能吸完一排。', tag: '童年' },
    ],
  },
  {
    id: 'cartoons',
    title: '动画片时间',
    subtitle: '放学冲回家，只为赶上片头曲的那几分钟。',
    items: [
      { name: '黑猫警长', year: 1984, description: '「眼睛瞪得像铜铃」，国产动画里最飒的警长，一集只有十几分钟。', tag: '国产' },
      { name: '葫芦兄弟', year: 1986, description: '七个葫芦娃，一根藤上七朵花。剪纸动画，反派是蛇精和蝎子精。', tag: '剪纸动画' },
      { name: '变形金刚', year: 1988, description: '「汽车人，变形出发！」动画和玩具一起卖，一个擎天柱是奢侈品。', tag: '引进' },
      { name: '灌篮高手', year: 1993, description: '「教练，我想打篮球。」樱木花道、流川枫、三井寿，主题曲一响就热血。', tag: '日漫' },
      { name: '数码宝贝', year: 1999, description: '「Butter-Fly」响起，亚古兽进化成暴龙兽，进化曲一响就想哭。', tag: '日漫' },
      { name: '喜羊羊与灰太狼', year: 2005, description: '00 后的童年，但 90 后也陪着看过几集，灰太狼永远抓不到羊。', tag: '00后' },
    ],
  },
  {
    id: 'slogans',
    title: '电视广告金句',
    subtitle: '那时候广告也要看完，因为台词比电视剧还熟。',
    items: [
      { name: '今年过节不收礼，收礼只收脑白金', year: 1998, description: '两个卡通老人扭了十几年，成为最长寿的广告。' },
      { name: '农夫山泉有点甜', year: 1998, description: '一句广告语，让一个品牌站住了脚，瓶子上还印着千岛湖。' },
      { name: '怕上火，喝王老吉', year: 2003, description: '火锅店、大排档，红罐子一摆，这句话无处不在。' },
      { name: '大宝天天见', year: 1990, description: '「要想皮肤好，早晚用大宝」，朴素又洗脑。' },
      { name: '康师傅方便面，好吃看得见', year: 1992, description: '红烧牛肉面的味道，是绿皮火车上的记忆。' },
      { name: 'just do it', year: 1988, description: '耐克的钩子第一次和这句话一起出现。', tag: '全球' },
    ],
  },
  {
    id: 'arcade',
    title: '游戏机与网吧',
    subtitle: '一块钱四个币，两块钱一小时，屏幕前永远围满了人。',
    items: [
      { name: '红白机', year: 1988, description: '插黄卡，两个手柄，一台电视。魂斗罗、超级玛丽、坦克大战，谁家有一台谁就是孩子王。', tag: '插卡' },
      { name: '街机厅', year: 1990, description: '一块钱四个币，拳皇 97、三国战纪、恐龙快打。没钱就站在别人背后看，也能看一个下午。', tag: '投币' },
      { name: '包机房', year: 1996, description: 'PS 和土星按小时收费，三块钱一小时，四五个人挤在一台电视前踢实况足球。', tag: '按小时' },
      { name: '网吧', year: 1996, description: '最早叫「网络咖啡屋」，拨号上网一小时十几块；后来降到两块，通宵包夜，耳机里全是枪声。', tag: '通宵' },
      { name: '热血传奇', year: 2001, description: '蜡烛、猪洞、沙巴克攻城，点卡要专门跑一趟书店。一件装备能换一顿饭。', tag: '网游' },
      { name: 'CS 1.5', year: 2002, description: '局域网里喊「Fire in the hole」，沙漠 2 和仓库最熟。被闪光弹一闪，一屋子人同时骂人。', tag: '联机' },
    ],
  },
  {
    id: 'appliances',
    title: '老电器',
    subtitle: '拍一拍就好的电视，转一转就响的收录机。',
    items: [
      { name: '黑白电视机', year: 1980, description: '九寸、十二寸，顶上立两根天线，没信号就拍两下。晚上全家围坐，屏幕上飘着雪花。', tag: '带天线' },
      { name: '双卡收录机', year: 1985, description: '燕舞牌，「燕舞，燕舞，一曲歌来一片情」。两个卡座能对录，还会闪一排小灯。', tag: '燕舞' },
      { name: '电风扇', year: 1980, description: '钻石牌、华生牌，铁壳子三档风速，摇头时「咔哒咔哒」。午睡对着吹，醒来还是一身汗。', tag: '铁壳' },
      { name: '单缸洗衣机', year: 1985, description: '白兰、水仙，洗一遍要自己拧干、换水，冬天手伸进凉水里，冻得通红。', tag: '手动' },
      { name: '录像机', year: 1990, description: '放录像带，租带子，录像厅门口贴着手写海报。磁头脏了，满屏都是条纹。', tag: '录像带' },
      { name: 'VCD 影碟机', year: 1995, description: '爱多、万利达、先科，一张碟两部电影。碟片划花了就读不过去，拿牙膏擦一擦接着放。', tag: '影碟' },
    ],
  },
  {
    id: 'campus',
    title: '校园生活',
    subtitle: '眼保健操、三八线，还有开学第一天包的书皮。',
    items: [
      { name: '眼保健操', year: 1980, description: '「第二节，挤按睛明穴」，全校广播里那个女声。总有人睁眼偷看，或者按错位置把眼睛按疼。', tag: '课间' },
      { name: '第七套广播体操', year: 1990, description: '喇叭挂在操场边的电线杆上，「现在开始，第七套广播体操」。冬天做操，手都插在袖筒里。', tag: '早操' },
      { name: '课桌三八线', year: 1980, description: '同桌用圆规在桌面上刻一条线，谁的胳膊肘过界就挨一记肘击，谁也不肯先让。', tag: '同桌' },
      { name: '黑板报', year: 1980, description: '教室后墙，粉笔、彩纸、花边，标题要写得又大又歪。检查前一天，全班留下来加班。', tag: '班会' },
      { name: '包书皮', year: 1980, description: '开学发了新书，用挂历纸反过来包，书角折成三角，最后用圆珠笔写上科目和名字。', tag: '开学' },
      { name: '毕业纪念册', year: 1995, description: '同学录一页页传着写：星座、电话、最想说的话，最后贴一张一寸照片，写「勿忘我」。', tag: '毕业' },
    ],
  },
];
