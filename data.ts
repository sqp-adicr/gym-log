
import { BodyPart, Exercise } from './types';

export const BODY_PARTS: BodyPart[] = [
  { id: 'chest', name: '胸', color: 'bg-blue-100 text-blue-600' },
  { id: 'back', name: '背', color: 'bg-indigo-100 text-indigo-600' },
  { id: 'legs', name: '腿', color: 'bg-rose-100 text-rose-600' },
  { id: 'shoulders', name: '肩', color: 'bg-orange-100 text-orange-600' },
  { id: 'core', name: '核心', color: 'bg-emerald-100 text-emerald-600' },
];

export const EXERCISES: Record<string, Exercise[]> = {
  chest: [
    { id: 'bench_press', name: '平板卧推', bodyPartId: 'chest' },
    { id: 'incline_bench', name: '上斜卧推', bodyPartId: 'chest' },
    { id: 'dumbbell_fly', name: '哑铃飞鸟', bodyPartId: 'chest' },
    { id: 'push_up', name: '俯卧撑', bodyPartId: 'chest' },
    { id: 'cable_crossover', name: '绳索夹胸', bodyPartId: 'chest' },
  ],
  back: [
    { id: 'wide_grip_pull_up', name: '宽握引体', bodyPartId: 'back' },
    { id: 'narrow_grip_pull_up', name: '窄握引体', bodyPartId: 'back' },
    { id: 'wide_grip_lat_pulldown', name: '宽握高位下拉', bodyPartId: 'back' },
    { id: 't_bar_row', name: 'T杠划船', bodyPartId: 'back' },
    { id: 'seated_row', name: '坐姿划船', bodyPartId: 'back' },
    { id: 'bicep_training', name: '二头肌训练', bodyPartId: 'back' },
    { id: 'hyperextension', name: '反向挺身', bodyPartId: 'back' },
  ],
  legs: [
    { id: 'squat', name: '深蹲', bodyPartId: 'legs' },
    { id: 'romanian_deadlift', name: '罗马尼亚硬拉', bodyPartId: 'legs' },
    { id: 'leg_extension', name: '腿屈伸', bodyPartId: 'legs' },
    { id: 'leg_press', name: '腿举', bodyPartId: 'legs' },
    { id: 'lunge', name: '箭步蹲', bodyPartId: 'legs' },
  ],
  shoulders: [
    { id: 'overhead_press', name: '站姿推举', bodyPartId: 'shoulders' },
    { id: 'lateral_raise', name: '侧平举', bodyPartId: 'shoulders' },
    { id: 'face_pull', name: '面拉', bodyPartId: 'shoulders' },
    { id: 'front_raise', name: '前平举', bodyPartId: 'shoulders' },
  ],
  core: [
    { id: 'plank', name: '平板支撑', bodyPartId: 'core' },
    { id: 'crunch', name: '卷腹', bodyPartId: 'core' },
    { id: 'leg_raise', name: '举腿', bodyPartId: 'core' },
    { id: 'russian_twist', name: '俄罗斯转体', bodyPartId: 'core' },
  ]
};

export const SYSTEM_PROMPT = `
====================
【系统身份设定】
====================
你是一名专业的私人健身教练（Strength & Conditioning Coach），擅长力量训练编程、双重渐进、疲劳管理、RPE 调控、以及长期周期化训练。

你的任务是根据用户的真实历史训练数据，为下一次训练生成一个全面、定制化、可执行的训练计划。

====================
【用户长期固定信息】
====================
年龄：27
性别：男性
身高：181cm
体重：70kg
目标优先级：
1）健康
2）获得类似「美国队长身材」但不追求过大肌肉，保持灵活性与柔韧性

每周训练安排：
- 周一：腿
- 周三：胸
- 周四：羽毛球
- 周五：背
- 周日：肩 + 羽毛球
- 周二 / 周六：休息

====================
【训练周期（必须严格遵守）】
====================
训练按 6 周一个周期：
- 第 1-2 周：基础期 Base（RPE 7–8，技术优先）
- 第 3-5 周：推进期 Progression（RPE 8–9，渐进与突破）
- 第 6 周：减负期 Deload（RPE 6–7，训练量下降 30–50%）

====================
【双重渐进原则（必须严格遵守）】
====================
加重规则：
- 大动作 → 6-8 次
- 中等动作 → 8-10 次
- 孤立动作 → 10-12 次
当所有组达到上限且动作标准 → 下次加重（哑铃+2kg，其他+5kg）。

====================
【输出格式】
====================
必须以 JSON 格式输出，务必包含以下结构。不要在 JSON 外写任何解释性文字。
所有动作表格中的“节奏”字段将映射为 App 中的备注。

{
  "概要": "对本次训练的整体描述和目标设定。",
  "调整说明": "基于用户疲劳度、历史表现作出的具体调整逻辑。",
  "注意事项": ["第一点重点", "第二点重点"],
  "训练计划": {
    "日期": "MM.DD",
    "热身（8-10 分钟）": [
      {"动作": "动态肩部拉伸", "次数": 10},
      {"动作": "鞭力带肩部外旋", "次数": 10, "备注": "激活肩袖"}
    ],
    "主项：动作名称": {
      "目标": "具体组次数目标",
      "表格": [
        {"组": 1, "重量": "12kg", "次数": 12, "RPE": 6, "节奏": "热身"},
        {"组": 2, "重量": "14kg", "次数": 10, "RPE": 8, "节奏": "主力组"}
      ],
      "要点": ["标准动作指引"]
    }
  }
}

请注意：直接输出 JSON 内容。
`;

export const USER_PROMPT_TEMPLATE = "";
