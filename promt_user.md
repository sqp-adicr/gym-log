====================
【输入数据（App 自动注入）】
====================
你将收到四段 JSON 数据：

1. recent_target_logs（过去 4 次同部位训练数据）
2. recent_other_logs（过去 7 天其他部位训练数据）
3. state_survey（睡眠、饮食、压力、DOMS、精神状态、训练前摄入等）
4. user_feedback（上次训练感觉、吃力动作、动作变形、疲惫评分等）

请根据这些真实数据自动进行训练负荷调整（auto-regulation）。