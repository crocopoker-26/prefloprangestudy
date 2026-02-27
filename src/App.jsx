import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Settings, 
  Copy, 
  Check as CheckIcon, 
  BarChart3, 
  FileJson,
  LayoutGrid,
  Info,
  Filter,
  Scale,
  Eye,
  ArrowRightLeft,
  MousePointer2,
  ChevronRight,
  ChevronLeft,
  Trophy,
  Medal,
  Upload,
  Loader2,
  MapPin,
  AlertCircle,
  X,
  RotateCcw,
  ArrowLeft,
  Crown,
  Coins,
  Zap,
  Swords,
  Play,
  FolderOpen
} from 'lucide-react';

// ==========================================
//  后台调试模式开关 (Admin Mode)
// ==========================================
const IS_ADMIN_MODE = false;

// ==========================================
//  扑克星球 - 两级目录范围数据库 (Mock Data)
// ==========================================
const FOLDERS_DB = [
  {
    id: 'folder-live-hu',
    title: '线下锦标赛 HU',
    desc: '专注于线下锦标赛单挑（双大盲模式）的 GTO 策略。涵盖不同码深下的极限博弈。',
    icon: Swords,
    color: 'from-blue-500 to-indigo-600',
    ranges: [
      { id: 'hu-10bb', title: 'HU 10BB', desc: '单挑末期短码的 10BB 策略。', url: '/range/offline_hu/HU10bb.zip', type: 'HU', difficulty: '必修' },
	    { id: 'hu-15bb', title: 'HU 15BB', desc: '单挑末期短码的 15BB 策略。', url: '/range/offline_hu/HU15bb.zip', type: 'HU', difficulty: '必修' },
	    { id: 'hu-20bb', title: 'HU 20BB', desc: '单挑中后期的 20BB 策略。', url: '/range/offline_hu/HU20bb.zip', type: 'HU', difficulty: '必修' },
	    { id: 'hu-25bb', title: 'HU 25BB', desc: '单挑中后期的 25BB 策略。', url: '/range/offline_hu/HU25bb.zip', type: 'HU', difficulty: '必修' },
      { id: 'hu-30bb', title: 'HU 30BB', desc: '单挑中期的 30BB 策略。', url: '/range/offline_hu/HU30bb.zip', type: 'HU', difficulty: '进阶' },
	    { id: 'hu-40bb', title: 'HU 40BB', desc: '单挑中期的 40BB 策略。', url: '/range/offline_hu/HU40bb.zip', type: 'HU', difficulty: '进阶' }
    ]
  },
  {
    id: 'folder-cash',
    title: '8人桌MTT',
    desc: 'MTT 的均码 Chip EV 基准线',
    icon: Coins,
    color: 'from-emerald-500 to-teal-600',
    ranges: [
      { id: 'cash-nl200', title: 'NL200 Cash 100BB', desc: '重点针对高抽水环境下的防守盲注与 3Bet 锅进行优化。', url: '/ranges/cash-nl200.zip', type: 'Cash', difficulty: '大师' }
    ]
  },
  {
    id: 'folder-wpt-turbo',
    title: 'WPT 极速',
    desc: 'WPT 极速桌抽水模式的 GTO 策略',
    icon: Zap,
    color: 'from-rose-500 to-red-600',
    ranges: [
      { id: 'wpt-turbo-15bb', title: 'WPT极速 15BB', desc: '极限生存阶段，ICM 强压下的首入局全下与跟注标准。', url: '/ranges/wpt-turbo-15bb.zip', type: 'MTT', difficulty: '必修' },
      { id: 'wpt-turbo-25bb', title: 'WPT极速 25BB', desc: '极速赛核心深度，包含高频的 3Bet All-in 与防守反击策略。', url: '/ranges/wpt-turbo-25bb.zip', type: 'MTT', difficulty: '核心' },
      { id: 'wpt-turbo-40bb', title: 'WPT极速 40BB', desc: '比赛早期或筹码领先者的扩张策略。', url: '/ranges/wpt-turbo-40bb.zip', type: 'MTT', difficulty: '进阶' }
    ]
  },
  {
    id: 'folder-wpt-main',
    title: 'GG AOF',
    desc: '全压或弃牌 GTO 策略',
    icon: Crown,
    color: 'from-amber-500 to-orange-600',
    ranges: [
      { id: 'wpt-main-100bb', title: 'WPT主赛 100BB', desc: '早期阶段 100BB 深度，涵盖完整 8 人桌 GTO 策略。', url: '/ranges/wpt-main-100bb.zip', type: 'MTT', difficulty: '核心' }
    ]
  }
];

const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

const HAND_MATRIX = (() => {
  const matrix = [];
  for (let i = 0; i < 13; i++) {
    for (let j = 0; j < 13; j++) {
      let hand = "";
      if (i < j) hand = ranks[i] + ranks[j] + 's';
      else if (i > j) hand = ranks[j] + ranks[i] + 'o';
      else hand = ranks[i] + ranks[j];
      matrix.push({ hand, row: i, col: j });
    }
  }
  return matrix;
})();

const getCombos = (hand) => {
  if (hand.length === 2) return 6;
  if (hand.endsWith('s')) return 4;
  return 12;
};

const ROUND_OPTIONS = [
  { label: '无', value: null },
  { label: '5%', value: 20 },
  { label: '10%', value: 10 },
  { label: '20%', value: 5 },
  { label: '25%', value: 4 },
  { label: '33%', value: 3 },
  { label: '50%', value: 2 },
];

const DEFAULT_JSON_STR = JSON.stringify({"player":1,"street":0,"children":4,"sequence":[{"player":0,"type":"C","amount":5000,"street":0}],"actions":[{"type":"F","amount":0},{"type":"X","amount":0},{"type":"R","amount":35000,"node":2},{"type":"R","amount":200000,"node":4}],"hands":{"22":{"weight":1.0,"played":[0.0,0.0,0.0,1.0],"evs":[0.0,1.47814,1.75191,2.08072]},"32o":{"weight":1.0,"played":[0.0,0.8918,0.1082,0.0],"evs":[0.0,0.62697,0.62613,0.53839]},"AA":{"weight":1.0,"played":[0,0,0.1,0.9],"evs":[0,2.5,4.8,5.2]}}}, null, 2);

const buildAutoFoldPath = (startNodeId, nodes) => {
  let currentId = startNodeId;
  const path = [];
  const visited = new Set();
  while (currentId && nodes[currentId] && !visited.has(currentId)) {
    visited.add(currentId);
    const nodeData = nodes[currentId];
    const foldIdx = (nodeData.actions || []).findIndex(a => a.type === 'F');
    if (foldIdx !== -1 && nodeData.actions[foldIdx].node !== undefined) {
      path.push({ nodeId: currentId, actionSelected: foldIdx });
      currentId = nodeData.actions[foldIdx].node.toString();
    } else {
      path.push({ nodeId: currentId, actionSelected: null });
      break;
    }
  }
  return path;
};

const calculateGameState = (sequence, treeData) => {
  const totalPlayers = treeData?.settings?.handdata?.stacks?.length || 2;
  const blinds = treeData?.settings?.handdata?.blinds || [];
  const bbSize = blinds[0] || 0;
  const sbSize = blinds[1] || 0;
  const anteSize = blinds[2] || 0;
  const anteType = treeData?.settings?.handdata?.anteType || '';
  
  let pot = 0;
  let currentBets = new Array(totalPlayers).fill(0);
  let antes = new Array(totalPlayers).fill(0);
  const hasStraddle = treeData?.settings?.handdata?.straddleType && treeData.settings.handdata.straddleType !== 'OFF';

  let sbIdx = totalPlayers - 2;
  let bbIdx = totalPlayers - 1;
  if (totalPlayers === 2) {
    sbIdx = 0;
    bbIdx = 1;
  }

  if (anteType && anteType.includes('BB_ANTE')) { 
    const actualAnte = anteSize > 0 ? anteSize : bbSize;
    antes[bbIdx] += actualAnte;
    pot += actualAnte; 
  } 
  else if (anteSize > 0) { 
    for (let i = 0; i < totalPlayers; i++) {
      antes[i] += anteSize;
      pot += anteSize;
    }
  }

  currentBets[sbIdx] = sbSize;
  currentBets[bbIdx] = bbSize;
  pot += bbSize + sbSize;

  if (totalPlayers > 2 && hasStraddle) {
     currentBets[0] = bbSize * 2; 
     pot += bbSize * 2;
  }

  for (const act of (sequence || [])) {
    if (act.type === 'C') { 
      const maxBet = Math.max(...currentBets, 0);
      const toCallRaw = Math.max(0, maxBet - currentBets[act.player]);
      const callAmount = act.amount !== undefined ? act.amount : toCallRaw;
      pot += callAmount; 
      currentBets[act.player] += callAmount; 
    } 
    else if (act.type === 'R') {
       let incremental = act.amount - (currentBets[act.player] || 0);
       if (incremental > 0) pot += incremental;
       currentBets[act.player] = act.amount;
    }
  }
  return { pot, currentBets, antes };
};

const App = () => {
  const [appView, setAppView] = useState('lobby');
  const [activeFolder, setActiveFolder] = useState(null); 
  const [activeRangeInfo, setActiveRangeInfo] = useState(null);

  const [jsonInput, setJsonInput] = useState("");
  const [copyStatus, setCopyStatus] = useState(false);
  const [hoveredHand, setHoveredHand] = useState(null);
  const [lockedHand, setLockedHand] = useState(null);
  const [activeTab, setActiveTab] = useState('visualizer');
  
  const [showEv, setShowEv] = useState(true); 
  const [enableCleaning, setEnableCleaning] = useState(true); 
  const [roundSteps, setRoundSteps] = useState(null); 
  const [enableEvNormalization, setEnableEvNormalization] = useState(true); 

  const [rangeHeightMode, setRangeHeightMode] = useState('normalized'); 
  const [theme, setTheme] = useState('darknight'); 
  
  const [bbSize, setBbSize] = useState(1000); 

  const [compareLeftIdx, setCompareLeftIdx] = useState(null);
  const [compareRightIdx, setCompareRightIdx] = useState(null);

  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [treeData, setTreeData] = useState(null); 
  
  const [activeNodes, setActiveNodes] = useState([]);
  const [focusLevelIdx, setFocusLevelIdx] = useState(0);

  const navContainerRef = useRef(null);
  const [showNavLeftArrow, setShowNavLeftArrow] = useState(false);
  const [showNavRightArrow, setShowNavRightArrow] = useState(false);

  const themeConfig = useMemo(() => {
    if (theme === 'wizard') {
      return {
        actions: ['#317ecc', '#5db461', '#e94444', '#8b1c1c', '#5a1212'], 
        zeroWeightBg: '#202226',        
        zeroWeightText: 'text-[#4c4c4c]', 
        validEmptyBg: '#202226',
        validText: 'text-white',        
        evPos: 'text-emerald-400 font-bold',
        evNeg: 'text-rose-400 font-bold',
        evBase: 'text-white opacity-90',
        textShadowClass: 'drop-shadow-sm',
        panelBarTextTitle: 'text-white/90',
        panelBarTextValue: 'text-white'
      };
    }
    if (theme === 'pio') {
      return {
        actions: ['#6197c9', '#90c28d', '#f19a82', '#a94638', '#8e3223'], 
        zeroWeightBg: '#595959',         
        zeroWeightText: 'text-[#4f4f4f]',
        validEmptyBg: '#595959',
        validText: 'text-black',         
        evPos: 'text-emerald-900 font-black',
        evNeg: 'text-rose-900 font-black',
        evBase: 'text-black opacity-80', 
        textShadowClass: 'drop-shadow-none',
        panelBarTextTitle: 'text-slate-900/90', 
        panelBarTextValue: 'text-slate-900'
      };
    }
    if (theme === 'soft') {
      return {
        actions: ['#6798b8', '#9ac49a', '#ff9999', '#B78BDB', '#fcd34d'], 
        zeroWeightBg: '#595959',
        zeroWeightText: 'text-[#4f4f4f]',
        validEmptyBg: '#595959',
        validText: 'text-slate-900',
        evPos: 'text-emerald-700 font-bold',
        evNeg: 'text-rose-700 font-bold',
        evBase: 'text-slate-900 opacity-80',
        textShadowClass: 'drop-shadow-sm',
        panelBarTextTitle: 'text-slate-800',
        panelBarTextValue: 'text-slate-900'
      };
    }
    return {
      actions: ['#3874A2', '#6bb36b', '#ef7171', '#9D64CF', '#eab917'], 
      zeroWeightBg: '#090b10',
      zeroWeightText: 'text-[#334155]',
      validEmptyBg: '#090b10',
      validText: 'text-white',
      evPos: 'text-emerald-400 font-bold',
      evNeg: 'text-rose-400 font-bold',
      evBase: 'text-white opacity-95', 
      textShadowClass: 'drop-shadow-[0_1.5px_1.5px_rgba(0,0,0,0.9)]',
      panelBarTextTitle: 'text-slate-300', 
      panelBarTextValue: 'text-white'
    };
  }, [theme]);

  const checkNavScroll = () => {
    if (navContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = navContainerRef.current;
      setShowNavLeftArrow(scrollLeft > 0);
      setShowNavRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    if (appView === 'viewer' && navContainerRef.current) {
      setTimeout(() => {
        if (navContainerRef.current) {
          navContainerRef.current.scrollTo({ left: navContainerRef.current.scrollWidth, behavior: 'smooth' });
          checkNavScroll();
        }
      }, 50);
    }
  }, [activeNodes.length, focusLevelIdx, appView]);

  const scrollNav = (direction) => {
    if (navContainerRef.current) {
      const scrollAmount = 300; 
      navContainerRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
      setTimeout(checkNavScroll, 300); 
    }
  };

  useEffect(() => {
    window.addEventListener('resize', checkNavScroll);
    return () => window.removeEventListener('resize', checkNavScroll);
  }, []);

  useEffect(() => {
    if (!treeData) setJsonInput(DEFAULT_JSON_STR);
  }, [treeData]);

  const currentNodeId = useMemo(() => {
    if (activeNodes.length === 0) return null;
    const validFocusIdx = Math.min(focusLevelIdx, activeNodes.length - 1);
    return activeNodes[validFocusIdx].nodeId;
  }, [activeNodes, focusLevelIdx]);

  useEffect(() => {
    if (treeData && treeData.nodes && currentNodeId) {
      setJsonInput(JSON.stringify(treeData.nodes[currentNodeId], null, 2));
      
      setCompareLeftIdx(prev => typeof prev === 'number' ? null : prev);
      setCompareRightIdx(prev => typeof prev === 'number' ? null : prev);
    }
  }, [currentNodeId, treeData]);

  const parsedData = useMemo(() => {
    try { return JSON.parse(jsonInput); } catch (e) { return null; }
  }, [jsonInput]);

  const actions = parsedData?.actions || [];
  
  const isCompareActive = useMemo(() => {
    if (compareLeftIdx === null || compareRightIdx === null) return false;
    return compareLeftIdx !== compareRightIdx;
  }, [compareLeftIdx, compareRightIdx]);

  useEffect(() => {
    if (isCompareActive) setShowEv(true);
  }, [isCompareActive]);

  const gameStateInfo = useMemo(() => {
    if (!treeData || !parsedData) return { pot: bbSize * 1.5, potInBB: 1.5, toCall: 0, potOdds: 0 }; 
    const state = calculateGameState(parsedData.sequence, treeData);
    const currentPlayer = parsedData.player;
    const myBet = state.currentBets[currentPlayer] || 0;
    const maxBet = Math.max(...state.currentBets, 0);
    const toCallRaw = Math.max(0, maxBet - myBet);
    const potOdds = toCallRaw > 0 ? (toCallRaw / (state.pot + toCallRaw)) : 0;
    return { pot: state.pot, potInBB: state.pot / bbSize, toCall: toCallRaw, potOdds: potOdds };
  }, [treeData, parsedData, bbSize]);

  const effectiveMaxBet = useMemo(() => {
    if (!treeData?.settings?.handdata?.stacks) return Infinity;
    const totalPlayers = treeData.settings.handdata.stacks.length;
    const blinds = treeData.settings.handdata.blinds || [];
    const bbSize = blinds[0] || 0;
    const anteSize = blinds[2] || 0;
    const anteType = treeData.settings.handdata.anteType || '';
    
    let antes = new Array(totalPlayers).fill(0);
    let bbIdx = totalPlayers === 2 ? 1 : totalPlayers - 1;

    if (anteType && anteType.includes('BB_ANTE')) { 
      const actualAnte = anteSize > 0 ? anteSize : bbSize;
      antes[bbIdx] += actualAnte;
    } else if (anteSize > 0) { 
      for (let i = 0; i < totalPlayers; i++) antes[i] += anteSize;
    }
    
    return Math.min(...treeData.settings.handdata.stacks.map((s, i) => s - antes[i]));
  }, [treeData]);

  const getActionColor = (nodeActions, actionIdx) => {
      const palette = themeConfig.actions;
      const action = nodeActions[actionIdx];
      if (!action) return palette[0];
      if (action.type === 'F') return palette[0];
      if (action.type === 'C' || action.type === 'X') return palette[1];
      if (action.type === 'R') {
        const raises = nodeActions.filter(a => a.type === 'R').sort((a, b) => a.amount - b.amount);
        const rIdx = raises.findIndex(r => r.amount === action.amount);
        
        let colorIdx = 2 + rIdx;

        if (effectiveMaxBet !== Infinity) {
          const isAllIn = action.amount >= effectiveMaxBet * 0.95;
          if (isAllIn && colorIdx < 3) colorIdx = 3; 
        }
        
        return palette[Math.min(colorIdx, palette.length - 1)];
      }
      return palette[0];
  };

  const actionColorsMap = useMemo(() => {
    return actions.map((_, i) => getActionColor(actions, i));
  }, [actions, themeConfig, effectiveMaxBet]);

  const processedHands = useMemo(() => {
    if (!parsedData || !parsedData.hands) return {};
    const newHands = {};
    const foldIndex = actions.findIndex(a => a.type === 'F');

    for (const [hand, data] of Object.entries(parsedData.hands)) {
      let newPlayed = [...data.played];
      let newEvs = [...data.evs];
      let newWeight = data.weight;
      if (newWeight < 0.05) newWeight = 0;

      if (enableCleaning) {
        let sum = 0;
        for (let i = 0; i < newPlayed.length; i++) {
          if (newPlayed[i] < 0.05) newPlayed[i] = 0;
          sum += newPlayed[i];
        }
        if (sum > 0 && sum < 1) { 
          for (let i = 0; i < newPlayed.length; i++) newPlayed[i] = newPlayed[i] / sum;
        }
      }

      if (enableEvNormalization) {
        const playedIndices = [];
        for (let i = 0; i < newPlayed.length; i++) if (newPlayed[i] > 0) playedIndices.push(i);
        if (playedIndices.length > 1) {
          if (foldIndex !== -1 && newPlayed[foldIndex] > 0) {
            playedIndices.forEach(idx => { newEvs[idx] = 0; });
          } else {
            let evSum = 0, pSum = 0;
            playedIndices.forEach(idx => {
              evSum += newPlayed[idx] * data.evs[idx];
              pSum += newPlayed[idx];
            });
            if (pSum > 0) {
              const weightedEv = evSum / pSum;
              playedIndices.forEach(idx => { newEvs[idx] = weightedEv; });
            }
          }
        }
      }

      if (roundSteps !== null) {
        let currentSum = newPlayed.reduce((a, b) => a + b, 0);
        if (currentSum > 0) {
          let normalized = newPlayed.map(p => p / currentSum);
          let rawSteps = normalized.map(p => p * roundSteps);
          let floorSteps = rawSteps.map(p => Math.floor(p));
          let remainders = rawSteps.map((p, i) => ({ val: p - floorSteps[i], idx: i }));
          let shortfall = roundSteps - floorSteps.reduce((a, b) => a + b, 0);
          remainders.sort((a, b) => b.val - a.val);
          for (let i = 0; i < shortfall; i++) floorSteps[remainders[i].idx] += 1;
          newPlayed = floorSteps.map(steps => steps / roundSteps);
        }
      }
      newHands[hand] = { ...data, weight: newWeight, played: newPlayed, evs: newEvs };
    }
    return newHands;
  }, [parsedData, enableCleaning, roundSteps, enableEvNormalization, actions]);

  const maxWeight = useMemo(() => {
    if (!processedHands) return 1;
    let max = 0;
    Object.values(processedHands).forEach(h => {
      if (h.weight > max) max = h.weight;
    });
    return max > 0 ? max : 1;
  }, [processedHands]);

  const getHandActionEv = (handData, selector) => {
    if (!handData || !handData.evs) return 0;
    if (typeof selector === 'number') return handData.evs[selector];
    const sortedEvs = [...handData.evs].sort((a, b) => b - a);
    if (selector === 'best') return sortedEvs[0];
    if (selector === 'second') return sortedEvs.length > 1 ? sortedEvs[1] : sortedEvs[0];
    return 0;
  };

  const getResolvedActionIdx = (handData, selector) => {
    if (typeof selector === 'number') return selector;
    if (!handData || !handData.evs) return 0;
    const evs = handData.evs;
    let bestIdx = 0; let maxEv = -Infinity;
    for (let i = 0; i < evs.length; i++) { if (evs[i] > maxEv) { maxEv = evs[i]; bestIdx = i; } }
    if (selector === 'best') return bestIdx;
    if (selector === 'second') {
      let secondIdx = bestIdx; let secondMax = -Infinity;
      for (let i = 0; i < evs.length; i++) { if (i !== bestIdx && evs[i] > secondMax) { secondMax = evs[i]; secondIdx = i; } }
      return secondIdx;
    }
    return 0;
  };

  const maxDiffValue = useMemo(() => {
    if (!isCompareActive) return 0.001;
    let max = 0.001;
    Object.values(processedHands).forEach(h => {
      if (h.weight > 0) {
        const leftEv = getHandActionEv(h, compareLeftIdx);
        const rightEv = getHandActionEv(h, compareRightIdx);
        const diff = Math.abs(leftEv - rightEv);
        if (diff > max) max = diff;
      }
    });
    return max;
  }, [processedHands, isCompareActive, compareLeftIdx, compareRightIdx]);

  const stats = useMemo(() => {
    if (!processedHands) return null;
    let totalCombos = 0;
    let actionCombos = new Array(actions.length).fill(0);
    Object.entries(processedHands).forEach(([hand, h]) => {
      const combos = getCombos(hand) * h.weight; 
      totalCombos += combos;
      h.played.forEach((p, idx) => { actionCombos[idx] += p * combos; });
    });
    if (totalCombos === 0) return actionCombos.map(() => '0.00');
    return actionCombos.map(w => ((w / totalCombos) * 100).toFixed(2));
  }, [processedHands, actions.length]);

  const getActionLabel = (action) => {
    const amountInBB = action.amount ? parseFloat((action.amount / bbSize).toFixed(2)) : '';
    if (action.type === 'F') return '弃牌';
    if (action.type === 'C') return amountInBB ? `跟注 ${amountInBB}` : '跟注';
    if (action.type === 'X') return '过牌';
    if (action.type === 'R') return amountInBB ? `加注 ${amountInBB}` : '加注';
    return action.type;
  };

  const getPlayerName = (playerIdx) => {
    const totalPlayers = treeData?.settings?.handdata?.stacks?.length || 2;
    const hasStraddle = treeData?.settings?.handdata?.straddleType && treeData.settings.handdata.straddleType !== 'OFF';
    
    if (totalPlayers === 2) return playerIdx === 0 ? 'SB' : 'BB';

    if (hasStraddle && playerIdx === 0) return 'STR';

    const posFromEnd = totalPlayers - 1 - playerIdx;
    
    if (posFromEnd === 0) return 'BB';
    if (posFromEnd === 1) return 'SB';
    if (posFromEnd === 2) return 'BTN';
    if (posFromEnd === 3) return 'CO';
    if (posFromEnd === 4) return 'HJ';
    if (posFromEnd === 5) return 'LJ';

    if (hasStraddle) {
      return playerIdx === 1 ? 'UTG' : `UTG+${playerIdx - 1}`;
    }
    
    return playerIdx === 0 ? 'UTG' : `UTG+${playerIdx}`;
  };

  const getSelectorLabel = (selector) => {
    if (selector === 'best') return "最优行动";
    if (selector === 'second') return "次优行动";
    if (typeof selector === 'number') return getActionLabel(actions[selector]);
    return "";
  };

  const formatEvValue = (ev, precision = 2, forcePlus = false) => {
    if (ev === undefined || ev === null) return "";
    if (Math.abs(ev) < 0.0005) return "0";
    const formatted = ev.toFixed(precision);
    return (forcePlus && ev > 0.0005) ? `+${formatted}` : formatted;
  };

  const getEvColorClass = (ev) => {
    if (ev > 0.0005) return "text-emerald-500";
    if (ev < -0.0005) return "text-rose-500";
    return "text-slate-500";
  };

  const getCompareColor = (diff) => {
    if (!isCompareActive) return 'transparent';
    const ratio = Math.min(Math.abs(diff) / maxDiffValue, 1);
    
    const baseR = 204;
    const baseG = 204;
    const baseB = 204;

    if (diff > 0.0005) {
      const r = Math.round(baseR + (16 - baseR) * ratio);
      const g = Math.round(baseG + (185 - baseG) * ratio);
      const b = Math.round(baseB + (129 - baseB) * ratio);
      return `rgb(${r}, ${g}, ${b})`;
    } else if (diff < -0.0005) {
      const r = Math.round(baseR + (239 - baseR) * ratio);
      const g = Math.round(baseG + (68 - baseG) * ratio);
      const b = Math.round(baseB + (68 - baseB) * ratio);
      return `rgb(${r}, ${g}, ${b})`;
    }
    return `rgb(${baseR}, ${baseG}, ${baseB})`;
  };

  const loadJSZip = async () => {
    if (window.JSZip) return window.JSZip;
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
      script.onload = () => resolve(window.JSZip);
      script.onerror = () => reject(new Error('JSZip 加载失败，请检查网络'));
      document.head.appendChild(script);
    });
  };

  const processZipData = async (zipData) => {
    const JSZipLib = await loadJSZip();
    const zipInstance = new JSZipLib();
    const zip = await zipInstance.loadAsync(zipData);
    let nodes = {};
    let settings = null;

    for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
      if (!zipEntry.dir) {
        if (relativePath.endsWith('settings.json')) {
          const content = await zipEntry.async('string');
          settings = JSON.parse(content);
        } else if (relativePath.endsWith('nodes.json')) {
          const content = await zipEntry.async('string');
          const parsedNodes = JSON.parse(content);
          nodes = { ...nodes, ...parsedNodes };
        } else if (relativePath.includes('nodes/') && relativePath.endsWith('.json')) {
          const content = await zipEntry.async('string');
          const match = relativePath.match(/\/(\d+)\.json$/) || relativePath.match(/^(\d+)\.json$/);
          if (match) nodes[match[1]] = JSON.parse(content);
        }
      }
    }

    if (Object.keys(nodes).length > 0) {
      setTreeData({ settings, nodes });
      const firstKey = nodes["0"] ? "0" : Object.keys(nodes)[0];
      const initialPath = buildAutoFoldPath(firstKey, nodes);
      setActiveNodes(initialPath);
      setFocusLevelIdx(0); 
      
      if (settings?.handdata?.blinds) {
        const bb = Math.max(...settings.handdata.blinds);
        setBbSize(bb);
      }
      setActiveTab('visualizer'); 
      return true;
    } else {
      throw new Error("ZIP 文件中没有找到有效的 HRC nodes 数据。");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    setErrorMsg("");
    try {
      await processZipData(file);
      setActiveRangeInfo(null);
      setAppView('viewer');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "解析 ZIP 文件失败，请确保格式正确。");
    } finally {
      setIsUploading(false);
      e.target.value = null; 
    }
  };

  const handleLoadFromCloud = async (range) => {
    setIsUploading(true);
    setErrorMsg("");
    try {
      const response = await fetch(range.url);
      if (!response.ok) throw new Error("无法从云端获取范围表数据 (此为 Demo 链接，需替换为真实 Supabase URL)。");
      const blob = await response.blob();
      await processZipData(blob);
      setActiveRangeInfo(range);
      setAppView('viewer');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopy = () => {
    const textArea = document.createElement("textarea");
    textArea.value = jsonInput;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    setCopyStatus(true);
    setTimeout(() => setCopyStatus(false), 2000);
  };

  const handleNodeActionClick = (levelIdx, actionIdx, actionData) => {
      const newActiveNodes = [...activeNodes.slice(0, levelIdx + 1)];
      newActiveNodes[levelIdx].actionSelected = actionIdx;

      if (actionData.node !== undefined) {
          const tailPath = buildAutoFoldPath(actionData.node.toString(), treeData.nodes);
          newActiveNodes.push(...tailPath);
          setActiveNodes(newActiveNodes);
          setFocusLevelIdx(levelIdx + 1); 
      } else {
          setActiveNodes(newActiveNodes);
          setFocusLevelIdx(levelIdx + 1); 
      }
  };

  const jumpToLevel = (levelIdx) => {
      const startNodeId = activeNodes[levelIdx].nodeId;
      const tailPath = buildAutoFoldPath(startNodeId, treeData.nodes);
      const newActiveNodes = [...activeNodes.slice(0, levelIdx), ...tailPath];
      setActiveNodes(newActiveNodes);
      setFocusLevelIdx(levelIdx);
  };

  const handleResetTree = () => {
      if (!treeData) return;
      const firstKey = treeData.nodes["0"] ? "0" : Object.keys(treeData.nodes)[0];
      const initialPath = buildAutoFoldPath(firstKey, treeData.nodes);
      setActiveNodes(initialPath);
      setFocusLevelIdx(0);
  };

  // ==========================================
  //  渲染层：大厅视图 (Lobby) 
  // ==========================================
  if (appView === 'lobby') {
    return (
      <div className="min-h-screen bg-[#0b0f1a] text-slate-300 font-sans select-none overflow-y-auto">
        <div className="max-w-[1200px] mx-auto px-6 py-12">
          
          <div className="flex flex-col items-center justify-center mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/20 mb-6">
              <LayoutGrid className="text-white" size={32} />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4 text-center">
              扑克星球 <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">范围数据库</span>
            </h1>
            <p className="text-slate-400 text-lg text-center max-w-2xl">
              选择对应的赛事结构与码深，探索基于顶级 Solver 运算的精确 GTO 策略树。为实战与复盘提供最强决策支撑。
            </p>
          </div>

          {errorMsg && (
            <div className="max-w-3xl mx-auto mb-8 bg-rose-500/10 text-rose-400 p-4 rounded-xl border border-rose-500/20 flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-3"><AlertCircle size={20} /> <span className="font-bold">{errorMsg}</span></div>
              <button onClick={() => setErrorMsg("")} className="hover:text-rose-200 transition-colors"><X size={20}/></button>
            </div>
          )}

          {!activeFolder && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="flex items-center justify-between mb-6 max-w-5xl mx-auto">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FolderOpen className="text-indigo-400" size={24} /> 所有目录
                </h2>
                <span className="text-sm font-bold text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full">
                  共 {FOLDERS_DB.length} 个系列
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {FOLDERS_DB.map((folder, idx) => (
                  <div 
                    key={folder.id}
                    onClick={() => setActiveFolder(folder)}
                    className="group relative bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 hover:bg-slate-800/80 hover:border-indigo-500/50 transition-all cursor-pointer overflow-hidden shadow-lg hover:shadow-indigo-500/10"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${folder.color} opacity-80 group-hover:opacity-100 transition-opacity`}></div>
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${folder.color} bg-opacity-10 bg-clip-padding backdrop-filter`}>
                        <folder.icon size={24} className="text-white drop-shadow-md" />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                          目录集
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">
                          {folder.ranges.length} 套范围
                        </span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                      {folder.title}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed mb-6 line-clamp-2">
                      {folder.desc}
                    </p>
                    
                    <div className="flex items-center text-xs font-bold text-slate-500 group-hover:text-indigo-400 transition-colors">
                      查看该系列范围 <ChevronRight size={14} className="ml-1" />
                    </div>
                  </div>
                ))}

                <label className="group relative bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-2xl p-6 hover:bg-slate-800/50 hover:border-slate-600 transition-all cursor-pointer flex flex-col items-center justify-center text-center min-h-[220px]">
                  <div className="p-4 rounded-full bg-slate-800/50 group-hover:bg-slate-700/50 transition-colors mb-4">
                    {isUploading ? <Loader2 size={28} className="text-slate-400 animate-spin" /> : <Upload size={28} className="text-slate-400 group-hover:text-white transition-colors" />}
                  </div>
                  <h3 className="text-lg font-bold text-slate-300 group-hover:text-white transition-colors mb-2">本地导入 ZIP</h3>
                  <p className="text-xs text-slate-500">支持 HRC 导出的 bundled nodes.json 或旧版多文件压缩包</p>
                  <input type="file" accept=".zip" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
            </div>
          )}

          {activeFolder && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 max-w-5xl mx-auto">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setActiveFolder(null)}
                    className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors flex items-center gap-2 text-sm font-bold shadow-sm"
                  >
                    <ArrowLeft size={16} /> 返回目录
                  </button>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2 ml-2">
                    <activeFolder.icon className="text-slate-500" size={20} />
                    <span className="text-slate-500">/</span> {activeFolder.title}
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeFolder.ranges.map((range, idx) => (
                  <div 
                    key={range.id}
                    onClick={() => !isUploading && handleLoadFromCloud(range)}
                    className="group relative bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 hover:bg-slate-800/80 hover:border-indigo-500/50 transition-all cursor-pointer overflow-hidden shadow-lg hover:shadow-indigo-500/10 animate-in fade-in"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-2.5 rounded-lg bg-slate-800`}>
                        <FileJson size={20} className="text-indigo-400 drop-shadow-md" />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                          {range.type}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-500">
                          {range.difficulty}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                      {range.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-6 line-clamp-2">
                      {range.desc}
                    </p>
                    
                    <div className="flex items-center text-xs font-bold text-slate-500 group-hover:text-indigo-400 transition-colors">
                      <Play size={14} className="mr-1.5" /> 载入解算器
                    </div>
                    
                    {isUploading && <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] z-10"></div>}
                  </div>
                ))}
                
                {activeFolder.ranges.length === 0 && (
                  <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-2xl">
                    <Info size={40} className="mb-3 opacity-50" />
                    <p className="text-sm font-bold tracking-widest">此目录下暂无范围表</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  //  渲染层：可视化解析器视图 (Viewer)
  // ==========================================
  return (
    <div className="min-h-screen bg-[#0b0f1a] text-slate-300 font-sans p-3 lg:p-4 select-none flex flex-col animate-in fade-in zoom-in-95 duration-300">
      
      <div className="max-w-[1400px] w-full mx-auto flex flex-col gap-1 lg:gap-1.5">
        
        <main className="flex flex-col gap-1 lg:gap-1.5 w-full">
          
          {/* 【核心优化】策略树导航器：极致紧凑与消除上下多余空隙 */}
          {treeData && activeNodes.length > 0 && activeTab === 'visualizer' && (
            <div className="w-full bg-slate-900/60 pr-2 py-1.5 lg:pr-2.5 lg:py-1.5 rounded-xl border border-slate-800/80 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-4 flex items-stretch">
              
              {/* 左侧功能区：固定 36px 宽度，使右侧边框与下方矩阵左边缘像素级对齐 */}
              <div className="flex flex-col justify-center items-center shrink-0 w-[36px] border-r border-slate-700/50 gap-2">
                <button 
                  onClick={() => { setAppView('lobby'); setTreeData(null); }}
                  className="flex items-center justify-center w-6 h-6 rounded-md bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-all active:scale-95 border border-slate-700 shadow-sm"
                  title="返回"
                >
                  <ArrowLeft size={12} />
                </button>
                <button 
                  onClick={handleResetTree}
                  className="flex items-center justify-center w-6 h-6 rounded-md bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-all active:scale-95 border border-slate-700 shadow-sm"
                  title="重置"
                >
                  <RotateCcw size={12} />
                </button>
                {IS_ADMIN_MODE && (
                  <span className="text-[8px] text-slate-500 font-mono font-bold mt-1">N:{currentNodeId}</span>
                )}
              </div>
              
              {/* 中间：水平滑动的策略树动作 (占据剩余所有空间) */}
              <div className="relative flex-1 overflow-hidden flex items-center min-w-0 pl-1.5">
                <div className={`absolute left-0 top-0 bottom-0 z-10 flex items-center pr-8 pl-1 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent transition-opacity duration-300 pointer-events-none ${showNavLeftArrow ? 'opacity-100' : 'opacity-0'}`}>
                   <button onClick={() => scrollNav('left')} className="p-1.5 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 shadow-lg border border-slate-700 transition-all pointer-events-auto active:scale-95"><ChevronLeft size={16} /></button>
                </div>

                <div ref={navContainerRef} onScroll={checkNavScroll} className="flex gap-1 w-full overflow-x-auto overflow-y-hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <style dangerouslySetInnerHTML={{__html: `div::-webkit-scrollbar { display: none; }`}} />

                    {activeNodes.map((levelState, levelIdx) => {
                        const nodeData = treeData.nodes[levelState.nodeId];
                        if (!nodeData) return null;
                        const isCurrentFocus = levelIdx === focusLevelIdx;
                        const isCompleted = levelIdx < focusLevelIdx;
                        const playerName = getPlayerName(nodeData.player);
                        const nodeActions = nodeData.actions || [];
                        const gameState = calculateGameState(nodeData.sequence, treeData);
                        
                        // ===== 全新升级：动态有效筹码计算 (支持 BB Ante 精确扣除) =====
                        const allStacks = treeData.settings?.handdata?.stacks || [];
                        const totalPlayersInHand = allStacks.length || 2;
                        let initialStack = allStacks[nodeData.player] || 0;
                        let remainingRaw = 0;

                        if (allStacks.length > 0) {
                            const activePlayers = new Set();
                            for (let i = 0; i < totalPlayersInHand; i++) activePlayers.add(i);
                            
                            // 读取当前节点前的历史记录，剔除所有已经 Fold 的玩家
                            for (const act of (nodeData.sequence || [])) {
                                if (act.type === 'F') activePlayers.delete(act.player);
                            }

                            // 1. 计算所有人的税后(扣除 Ante 后)筹码
                            const postAnteStacks = allStacks.map((st, pIdx) => Math.max(0, st - (gameState.antes[pIdx] || 0)));

                            // 2. 在剩余活跃玩家中，找出对手的最大税后筹码量
                            let maxOtherPostAnte = 0;
                            let hasOtherActive = false;
                            for (const p of activePlayers) {
                                if (p !== nodeData.player) {
                                    hasOtherActive = true;
                                    const pStack = postAnteStacks[p] || 0;
                                    if (pStack > maxOtherPostAnte) maxOtherPostAnte = pStack;
                                }
                            }
                            
                            // 3. 自身税后筹码和对手最大税后筹码取小者，即为此时真实的"有效税后筹码"
                            let effectivePostAnteStack = postAnteStacks[nodeData.player] || 0;
                            if (hasOtherActive) {
                                effectivePostAnteStack = Math.min(effectivePostAnteStack, maxOtherPostAnte);
                            }

                            // 4. 最终后手剩余 = 有效税后筹码 - 当前轮该玩家已下注金额
                            remainingRaw = Math.max(0, effectivePostAnteStack - (gameState.currentBets[nodeData.player] || 0));
                        } else {
                            // Fallback：如果没有 stacks 数据，采用原始基础减法
                            remainingRaw = Math.max(0, initialStack - (gameState.antes[nodeData.player] || 0) - (gameState.currentBets[nodeData.player] || 0));
                        }
                        // ===================================

                        let remainingDisplay = (remainingRaw / bbSize).toFixed(1);
                        if (remainingDisplay.endsWith('.0')) remainingDisplay = remainingDisplay.slice(0, -2);

                        let hasFolded = false;
                        if (isCompleted && levelState.actionSelected !== null) {
                            const selectedAct = nodeActions[levelState.actionSelected];
                            if (selectedAct && selectedAct.type === 'F' && selectedAct.node !== undefined) {
                                hasFolded = true;
                            }
                        }

                        const columnOpacity = hasFolded ? 'opacity-40 grayscale-[40%]' : 'opacity-100';

                        // 模仿 Wizard UI：统一粗细为 500 (font-medium)，未选中调亮为 slate-300
                        return (
                            <div key={levelIdx} className="flex items-start shrink-0">
                                <div className={`flex flex-col w-[96px] h-[114px] p-[3px] rounded-lg border transition-all duration-300 ${isCurrentFocus ? 'bg-slate-800/40 border-slate-600 shadow-md' : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600/50'} ${columnOpacity}`}>
                                    
                                    {/* 顶部位置与筹码：如果是焦点玩家，采用 bg-indigo-600 高亮。全统一 500 字重，未激活 slate-300 */}
                                    <button 
                                      onClick={() => jumpToLevel(levelIdx)}
                                      className={`flex items-center justify-between pl-2.5 pr-1.5 py-1 mb-[2px] shrink-0 rounded transition-colors w-full ${isCurrentFocus ? 'bg-indigo-600 shadow-sm' : 'hover:bg-slate-700/30'}`}
                                    >
                                        <span className={`text-[12px] font-medium leading-none uppercase tracking-wider ${isCurrentFocus ? 'text-white' : 'text-slate-300'}`}>{playerName}</span>
                                        <span className={`text-[12px] font-mono leading-none font-medium ${isCurrentFocus ? 'text-white opacity-100' : 'text-slate-300 opacity-90'}`}>{remainingDisplay}</span>
                                    </button>

                                    <div className="flex flex-col gap-[1px] flex-1 overflow-hidden">
                                        {nodeActions.map((action, actionIdx) => {
                                            const isSelected = isCompleted && levelState.actionSelected === actionIdx;
                                            const hasNode = action.node !== undefined;
                                            const color = getActionColor(nodeActions, actionIdx);

                                            return (
                                                <button
                                                    key={actionIdx}
                                                    onClick={() => handleNodeActionClick(levelIdx, actionIdx, action)}
                                                    className={`group relative flex items-center justify-between pl-2.5 pr-1.5 py-1 rounded transition-all shrink-0 ${isSelected ? 'bg-slate-600/80 shadow-sm' : 'bg-transparent hover:bg-slate-700/60'}`}
                                                >
                                                    <div className={`absolute left-0 top-0 bottom-0 rounded-l transition-all ${isSelected ? 'w-1.5' : 'w-1 group-hover:w-1.5'}`} style={{backgroundColor: color}}></div>
                                                    
                                                    {/* 统一粗细为 500 (font-medium)，选中时仅变白，未激活 slate-300 */}
                                                    <span className={`z-10 truncate text-[12px] leading-none text-left font-medium transition-colors ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                                                        {getActionLabel(action)}
                                                    </span>
                                                    
                                                    {hasNode ? (
                                                        <ChevronRight size={12} className={`transition-transform flex-shrink-0 ml-0.5 ${isSelected ? 'text-slate-300 translate-x-0.5' : 'text-slate-600 group-hover:text-slate-400'}`} />
                                                    ) : (
                                                        <span className={`text-[9px] font-normal whitespace-nowrap ml-1 scale-90 flex-shrink-0 transition-colors ${isSelected ? 'text-slate-300' : 'text-slate-600 group-hover:text-slate-400'}`}>终点</span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className={`absolute right-0 top-0 bottom-0 z-10 flex items-center pl-8 pr-1 bg-gradient-to-l from-slate-900 via-slate-900/80 to-transparent transition-opacity duration-300 pointer-events-none ${showNavRightArrow ? 'opacity-100' : 'opacity-0'}`}>
                   <button onClick={() => scrollNav('right')} className="p-1.5 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 shadow-lg border border-slate-700 transition-all pointer-events-auto active:scale-95"><ChevronRight size={16} /></button>
                </div>
              </div>

            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 items-start w-full">
            
            {/* 左侧：工具栏 + 热力图矩阵 */}
            <div className="lg:col-span-8 flex flex-col bg-slate-900/40 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden pb-6">
              
              {/* 操作台 */}
              <div className="w-full flex justify-start h-[44px] border-b border-slate-800/50 bg-slate-900/20 shrink-0">
                
                {/* 约束最大宽度并应用精确左内边距 (36px) 以对齐导航器竖线 */}
                <div className="w-full max-w-[752px] pl-[36px] pr-4 flex items-center justify-between">
                  {IS_ADMIN_MODE ? (
                     <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setEnableCleaning(!enableCleaning)}>
                          <Filter size={13} className={enableCleaning ? 'text-indigo-400' : 'text-slate-500'} />
                          <span className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${enableCleaning ? 'text-indigo-400' : 'text-slate-500'}`}>清洗 5%</span>
                        </div>
                        <div className="flex bg-black/40 p-0.5 rounded-lg border border-slate-800">
                          {['visualizer', 'json'].map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                              {tab === 'visualizer' ? '矩阵' : 'JSON'}
                            </button>
                          ))}
                        </div>
                     </div>
                  ) : (
                    <div className="flex items-center gap-3 lg:gap-4">
                      <div className="flex items-center gap-1.5 cursor-pointer group" onClick={() => setShowEv(!showEv)}>
                        <Eye size={13} className={showEv ? 'text-indigo-400' : 'text-slate-500'} />
                        <span className={`text-[11px] font-bold transition-colors ${showEv ? 'text-indigo-400' : 'text-slate-500'}`}>EV</span>
                        <div className={`w-6 h-3.5 ml-0.5 rounded-full relative transition-colors ${showEv ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                          <div className={`w-2 h-2 bg-white rounded-full absolute top-[3px] transition-transform ${showEv ? 'translate-x-[15px]' : 'translate-x-[3px]'}`}></div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-500 hidden sm:inline">取整:</span>
                        <div className="flex bg-black/40 p-0.5 rounded-md border border-slate-800">
                          {ROUND_OPTIONS.map(opt => (
                            <button key={opt.label} onClick={() => setRoundSteps(opt.value)} className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${roundSteps === opt.value ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>{opt.label}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 lg:gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-500 hidden sm:inline">高度:</span>
                      <select 
                        value={rangeHeightMode} 
                        onChange={e => setRangeHeightMode(e.target.value)} 
                        className="bg-transparent border border-slate-700/60 rounded p-1 text-[10px] text-slate-300 outline-none cursor-pointer hover:border-slate-500 transition-colors"
                      >
                        <option value="normalized" className="bg-slate-800 text-slate-300">标准化 (默认)</option>
                        <option value="weight" className="bg-slate-800 text-slate-300">范围高度</option>
                        <option value="full" className="bg-slate-800 text-slate-300">完整高度</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-500 hidden sm:inline">主题:</span>
                      <select 
                        value={theme} 
                        onChange={e => setTheme(e.target.value)} 
                        className="bg-transparent border border-slate-700/60 rounded p-1 text-[10px] text-slate-300 outline-none cursor-pointer hover:border-slate-500 transition-colors"
                      >
                        <option value="darknight" className="bg-slate-800 text-slate-300">暗夜 (默认)</option>
                        <option value="soft" className="bg-slate-800 text-slate-300">柔和</option>
                        <option value="pio" className="bg-slate-800 text-slate-300">PIO</option>
                        <option value="wizard" className="bg-slate-800 text-slate-300">Wizard</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* 矩阵区域 */}
              <div className="w-full max-w-[752px] pl-[36px] pr-4 mt-[20px] mb-2 shrink-0">
                <div className="w-full relative aspect-square">
                  <div className="absolute -top-5 left-0 w-full grid text-center" style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }}>
                    {ranks.map(r => <span key={r} className="text-[10px] lg:text-[11px] font-bold text-slate-500">{r}</span>)}
                  </div>
                  <div className="absolute top-0 -left-5 h-full grid items-center text-right pr-2" style={{ gridTemplateRows: 'repeat(13, minmax(0, 1fr))' }}>
                    {ranks.map(r => <span key={r} className="text-[10px] lg:text-[11px] font-bold text-slate-500 h-full flex items-center justify-end">{r}</span>)}
                  </div>

                  <div 
                    className="grid gap-[1px] bg-slate-700/30 border border-slate-700/30 rounded-sm overflow-hidden h-full w-full shadow-inner" 
                    style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))', gridTemplateRows: 'repeat(13, minmax(0, 1fr))' }}
                    onMouseLeave={() => setHoveredHand(null)}
                  >
                    {HAND_MATRIX.map(({ hand }) => {
                      const h = processedHands[hand];
                      const played = h?.played || [];
                      const weight = h?.weight ?? 0;
                      const isZeroWeight = weight === 0;
                      
                      let strategyGradient = "#1a1f2e";
                      let evDisplayVal = "";
                      let bgOpacity = 1;
                      
                      let isHeatmap = isCompareActive && compareLeftIdx === 'best';
                      let isBlunder = false; 

                      if (!isZeroWeight && h) {
                        let currentPercent = 0;
                        const gradients = [];
                        for (let i = played.length - 1; i >= 0; i--) {
                          if (played[i] > 0) {
                            const start = currentPercent;
                            currentPercent += played[i] * 100;
                            gradients.push(`${actionColorsMap[i]} ${start}% ${currentPercent}%`);
                          }
                        }
                        const defaultGradient = `linear-gradient(to right, ${gradients.join(', ')})`;

                        if (isCompareActive) {
                          const leftEv = getHandActionEv(h, compareLeftIdx);
                          const rightEv = getHandActionEv(h, compareRightIdx);
                          const diff = leftEv - rightEv;
                          
                          if (isHeatmap) {
                            strategyGradient = defaultGradient;
                            const potInBB = gameStateInfo.potInBB;
                            const diffPct = (Math.abs(diff) / potInBB) * 100;
                            
                            // 调整 alpha 透明度以更好地展示热力图差异
                            if (diffPct > 10) { bgOpacity = 1.0; isBlunder = true; }
                            else if (diffPct >= 3) bgOpacity = 0.8;
                            else if (diffPct >= 1) bgOpacity = 0.5;
                            else bgOpacity = 0.2;
                            
                            evDisplayVal = formatEvValue(diff, 2, true); 
                          } else {
                            strategyGradient = getCompareColor(diff);
                            evDisplayVal = formatEvValue(diff, 2, true);
                          }
                        } else {
                            strategyGradient = defaultGradient;
                            evDisplayVal = formatEvValue(Math.max(...h.evs));
                        }
                      }

                      let finalHeight = '100%';
                      if (!isZeroWeight && h) {
                        if (rangeHeightMode === 'weight') finalHeight = `${weight * 100}%`;
                        else if (rangeHeightMode === 'normalized') finalHeight = `${(weight / maxWeight) * 100}%`;
                        else finalHeight = '100%'; 
                      }

                      let evClass = themeConfig.evBase;
                      if (isHeatmap) {
                        evClass = (theme === 'wizard' || theme === 'darknight') ? 'text-white font-bold' : 'text-black font-black';
                      } else if (isCompareActive) {
                        evClass = 'text-black font-bold';
                      } else if (h && Math.max(...h.evs) < -0.005) {
                        evClass = themeConfig.evNeg;
                      }

                      const textOpacityStyle = (isHeatmap && (theme === 'wizard' || theme === 'darknight')) ? { opacity: bgOpacity } : {};

                      let cellValidText = themeConfig.validText;
                      let cellZeroWeightText = themeConfig.zeroWeightText;
                      let cellZeroWeightBg = themeConfig.zeroWeightBg;
                      let cellValidEmptyBg = themeConfig.validEmptyBg;
                      let cellTextShadow = themeConfig.textShadowClass;

                      if (isCompareActive && !isHeatmap) {
                        cellValidText = 'text-slate-900';
                        cellZeroWeightText = 'text-[#4f4f4f]';
                        cellZeroWeightBg = '#595959';
                        cellValidEmptyBg = '#595959';
                        cellTextShadow = 'drop-shadow-sm';
                      }

                      return (
                        <div 
                          key={hand} 
                          onMouseEnter={() => setHoveredHand(hand)} 
                          onClick={() => setLockedHand(lockedHand === hand ? null : hand)} 
                          className={`relative aspect-square flex flex-col items-center justify-center transition-all cursor-pointer ${isZeroWeight ? cellZeroWeightText : cellValidText}`} 
                          style={{ backgroundColor: isZeroWeight ? cellZeroWeightBg : cellValidEmptyBg }}
                        >
                          {!isZeroWeight && <div className="absolute bottom-0 left-0 right-0 w-full transition-all duration-300" style={{ height: finalHeight, background: strategyGradient, opacity: bgOpacity }}></div>}
                          {isBlunder && <div className="absolute inset-0 border-[2px] border-white z-20 pointer-events-none shadow-sm"></div>}
                          
                          <div 
                            className={`relative z-10 flex flex-col items-center justify-center w-full h-full pointer-events-none leading-none transition-opacity duration-300 ${cellTextShadow}`}
                            style={textOpacityStyle}
                          >
                            <span className={`w-full text-center text-[12px] md:text-[14px] lg:text-[16px] font-normal transition-transform duration-300 ${showEv ? '-translate-y-[4px] md:-translate-y-[5px]' : 'translate-y-0'}`}>
                              {hand}
                            </span>
                            {showEv && !isZeroWeight && h && (
                              <span className={`absolute bottom-[3px] md:bottom-[4px] left-0 w-full text-center text-[8px] md:text-[10px] lg:text-[11px] font-normal tracking-tight ${evClass} scale-90 md:scale-100`}>
                                {evDisplayVal}
                              </span>
                            )}
                          </div>
                          
                          {hoveredHand === hand && lockedHand !== hand && <div className="absolute inset-0 border border-white/50 z-20 pointer-events-none"></div>}
                          {lockedHand === hand && <div className="absolute inset-0 border-[2px] border-indigo-400 z-20 pointer-events-none shadow-[0_0_8px_rgba(129,140,248,0.8)]"></div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧面板 */}
            <div className="lg:col-span-4 flex flex-col gap-2 w-full h-full">
              {activeTab === 'json' ? (
                <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 flex flex-col gap-3 animate-in fade-in min-h-[500px]">
                  <div className="flex items-center justify-between"><div className="flex items-center gap-2"><FileJson size={16} className="text-slate-400" /><h2 className="text-[13px] font-bold text-white tracking-wider">JSON 编辑器</h2></div><button onClick={handleCopy} className="text-[10px] bg-slate-800 px-2 py-1 rounded hover:bg-slate-700 transition-colors">{copyStatus ? "已复制" : "复制"}</button></div>
                  <textarea className="w-full flex-grow p-4 font-mono text-[10px] bg-black/60 text-emerald-500 rounded-xl border border-slate-800 outline-none resize-none shadow-inner" value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} spellCheck="false" />
                </div>
              ) : (
                <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-right-4 w-full h-full">
                  
                  {/* 独立底池 & 赔率模块 */}
                  <div className="grid grid-cols-2 gap-1.5 shrink-0 h-[44px]">
                    <div className="bg-slate-900/80 rounded-xl border border-slate-800 px-3 flex flex-row items-center justify-between h-full backdrop-blur-md">
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px] uppercase font-bold"><Coins size={12} /> 底池 (BB)</div>
                      <div className="text-[11px] font-black text-slate-300">{parseFloat(gameStateInfo.potInBB.toFixed(2))}</div>
                    </div>
                    <div className="bg-slate-900/80 rounded-xl border border-slate-800 px-3 flex flex-row items-center justify-between h-full backdrop-blur-md">
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px] uppercase font-bold"><Zap size={12} /> 赔率</div>
                      <div className="text-[11px] font-black text-slate-300">{(gameStateInfo.potOdds * 100).toFixed(1)}%</div>
                    </div>
                  </div>

                  {/* 整体范围频率 */}
                  <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-3 backdrop-blur-md flex flex-col gap-1.5 shrink-0">
                    <div className="flex gap-[2px]">{actions.map((action, idx) => {
                      const f = stats ? stats[idx] : '0.00';
                      const isZero = parseFloat(f) === 0;
                      const roundedClass = idx === 0 ? 'rounded-l-md' : (idx === actions.length - 1 ? 'rounded-r-md' : '');
                      return (
                        <div key={idx} className={`flex-1 min-w-0 flex flex-col justify-between items-start px-1.5 py-2 h-[75px] transition-all ${roundedClass} ${isZero ? 'opacity-40 grayscale-[50%]' : 'shadow-sm hover:brightness-105'}`} style={{backgroundColor: actionColorsMap[idx]}}>
                          <span className={`text-[16px] font-medium leading-none tracking-tight truncate w-full text-left ${themeConfig.textShadowClass} ${themeConfig.panelBarTextValue}`}>{getActionLabel(action)}</span>
                          <span className={`text-[16px] font-medium tracking-tighter truncate w-full text-left ${themeConfig.textShadowClass} ${themeConfig.panelBarTextValue}`}>{f}%</span>
                        </div>
                      );
                    })}</div>
                    <div className="w-full h-1.5 bg-slate-800/50 rounded-full overflow-hidden flex shrink-0">{actions.map((a, i) => parseFloat(stats[i]) === 0 ? null : <div key={i} style={{ width: `${stats[i]}%`, backgroundColor: actionColorsMap[i] }} className="h-full"></div>)}</div>
                  </div>

                  {/* 手牌详情 */}
                  <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 backdrop-blur-md relative flex flex-col overflow-hidden h-[236px] shrink-0">
                    {lockedHand && <div className="absolute top-4 right-4 bg-indigo-500/20 text-indigo-400 text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1 border border-indigo-500/30"><CheckIcon size={12} /> 已锁定</div>}
                    {(!lockedHand && !hoveredHand) || !processedHands[lockedHand || hoveredHand] ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-3 border-2 border-dashed border-slate-800 rounded-xl"><MousePointer2 size={28} /><p className="text-[11px] font-bold uppercase tracking-widest">请将鼠标移至矩阵上方</p></div>
                    ) : processedHands[lockedHand || hoveredHand].weight === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-3 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/20">
                        <Info size={28} className="opacity-50" />
                        <p className="text-[11px] font-bold tracking-widest">手牌不在当前范围中</p>
                      </div>
                    ) : (
                      <>
                        <div className="shrink-0 flex items-baseline gap-3 mb-3">
                          <h2 className="text-3xl font-black text-white italic tracking-tighter">{lockedHand || hoveredHand}</h2>
                        </div>
                        
                        {/* 表头说明 */}
                        <div className="shrink-0 flex justify-between items-end text-[11px] font-bold text-slate-500 border-b border-slate-800 pb-1.5 mb-2">
                          <span>动作</span>
                          <div className="flex items-center gap-2">
                            <span className="w-16 text-right">策略</span>
                            <span className="w-16 text-right">EV</span>
                          </div>
                        </div>

                        <div className="overflow-y-auto space-y-2 pr-1">
                          {actions.map((a, i) => {
                            const hData = processedHands[lockedHand || hoveredHand];
                            const f = (hData.played[i] * 100).toFixed(1);
                            const currentEv = hData.evs[i];
                            return (
                              <div key={i} className={`group ${parseFloat(f) === 0 ? 'opacity-60' : ''}`}>
                                <div className="flex justify-between text-[12px] font-bold mb-1">
                                  <span className="flex items-center gap-2"><span className="w-1.5 h-3.5 rounded-full" style={{backgroundColor: actionColorsMap[i]}}></span>{getActionLabel(a)}</span>
                                  <div className="flex items-center gap-2 font-mono">
                                    <span className="w-16 text-right text-white">{f}%</span>
                                    <span className={`w-16 text-right ${getEvColorClass(currentEv)}`}>{formatEvValue(currentEv, 3, isCompareActive)}</span>
                                  </div>
                                </div>
                                <div className="w-full h-1 bg-black rounded-full overflow-hidden border border-slate-800"><div className="h-full" style={{ width: `${f}%`, backgroundColor: actionColorsMap[i] }}></div></div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  {/* EV 比较器 */}
                  <div className="bg-indigo-600/10 rounded-2xl border border-indigo-500/20 p-4 flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <ArrowRightLeft size={14} className="text-indigo-400" />
                        <h2 className="text-[12px] font-bold text-white tracking-wider">EV 比较器</h2>
                      </div>
                      <button onClick={() => {setCompareLeftIdx(null); setCompareRightIdx(null);}} className={`text-[9px] font-bold uppercase transition-all ${isCompareActive ? 'text-indigo-400' : 'opacity-0'}`}>重置</button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase text-center mb-0.5">被减数 (左)</span>
                        {actions.map((a, i) => <button key={i} onClick={() => setCompareLeftIdx(compareLeftIdx === i ? null : i)} className={`text-[10px] font-bold py-1.5 px-2 rounded-md border transition-all truncate ${compareLeftIdx === i ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}>{getActionLabel(a)}</button>)}
                        <button onClick={() => setCompareLeftIdx(compareLeftIdx === 'best' ? null : 'best')} className={`text-[10px] font-bold py-1.5 px-2 rounded-md border transition-all flex items-center justify-center gap-1 mt-0.5 ${compareLeftIdx === 'best' ? 'bg-amber-600 border-amber-400 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-amber-500'}`}><Trophy size={10} /> 最优</button>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase text-center mb-0.5">减数 (右)</span>
                        {actions.map((a, i) => <button key={i} onClick={() => setCompareRightIdx(compareRightIdx === i ? null : i)} className={`text-[10px] font-bold py-1.5 px-2 rounded-md border transition-all truncate ${compareRightIdx === i ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}>{getActionLabel(a)}</button>)}
                        <button onClick={() => setCompareRightIdx(compareRightIdx === 'second' ? null : 'second')} className={`text-[10px] font-bold py-1.5 px-2 rounded-md border transition-all flex items-center justify-center gap-1 mt-0.5 ${compareRightIdx === 'second' ? 'bg-slate-600 border-slate-400 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-400'}`}><Medal size={10} /> 次优</button>
                      </div>
                    </div>

                    {/* 说明栏 */}
                    <div className="mt-2.5 min-h-[50px] relative">
                      <div className={`absolute inset-0 p-2 flex flex-col justify-center bg-indigo-500/10 rounded-lg border border-indigo-500/20 text-[11px] text-indigo-300 text-center leading-relaxed transition-all duration-300 ${isCompareActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none'}`}>
                        {compareLeftIdx === 'best' ? (
                          <><div><span className="font-black text-white text-[12px]">失误热力图</span>：展示执行 <span className="font-black text-white text-[12px]">{getSelectorLabel(compareRightIdx)}</span> 的 EV 损失</div><span className="text-[10px] text-slate-400 mt-0.5 block tracking-tighter">透明度区分4档 EV 差：底池的 0-1%, 1-3%, 3-10%, 10%+</span></>
                        ) : (
                          <><div className="text-[12px]">正在展示收益差：</div><div><span className="font-black text-white text-[12px]">{getSelectorLabel(compareLeftIdx)}</span> <span className="mx-1.5 text-slate-500">减去</span> <span className="font-black text-white text-[12px]">{getSelectorLabel(compareRightIdx)}</span></div></>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
