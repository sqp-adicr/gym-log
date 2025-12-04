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
    { id: 'pull_up', name: '引体向上', bodyPartId: 'back' },
    { id: 'lat_pulldown', name: '高位下拉', bodyPartId: 'back' },
    { id: 'barbell_row', name: '杠铃划船', bodyPartId: 'back' },
    { id: 'seated_row', name: '坐姿划船', bodyPartId: 'back' },
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
