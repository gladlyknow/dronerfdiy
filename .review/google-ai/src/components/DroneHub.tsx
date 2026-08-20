import React, { useState } from 'react';
import { DRONE_KNOWLEDGE_NODES } from '../data/droneAndDiyData';
import { KnowledgeNode } from '../types';

export const DroneHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'arch' | 'laws' | 'betaflight' | 'rf_ant'>('arch');
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode>(DRONE_KNOWLEDGE_NODES[0]);

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 py-4 sm:py-6 space-y-6 animate-in fade-in duration-200">
      {/* Hero Banner */}
      <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 border border-sky-500/30 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <span>🚁 DRONE & FPV AVIONICS HUB</span>
            <span>•</span>
            <span>无人机与穿越机极客专区</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-mono">
            FPV 穿越机系统架构与航电技术
          </h1>
          <p className="text-sm sm:text-base text-slate-300">
            涵盖多旋翼动力闭环、飞控与 PID 算法、ELRS 2.4G/915M 高刷无线电链路、5.8GHz 圆极化图传天线与 2024 最新 CAAC 空域法规。
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('arch')}
          className={`px-4 py-2 text-xs sm:text-sm font-mono font-bold rounded-xl whitespace-nowrap transition-all ${
            activeTab === 'arch'
              ? 'bg-sky-500 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          🛸 五大硬件子系统拓扑
        </button>
        <button
          onClick={() => setActiveTab('laws')}
          className={`px-4 py-2 text-xs sm:text-sm font-mono font-bold rounded-xl whitespace-nowrap transition-all ${
            activeTab === 'laws'
              ? 'bg-sky-500 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          📜 2024 无人机法规与空域 (120m)
        </button>
        <button
          onClick={() => setActiveTab('betaflight')}
          className={`px-4 py-2 text-xs sm:text-sm font-mono font-bold rounded-xl whitespace-nowrap transition-all ${
            activeTab === 'betaflight'
              ? 'bg-sky-500 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          ⚙️ Betaflight 调参与 PID 理论
        </button>
        <button
          onClick={() => setActiveTab('rf_ant')}
          className={`px-4 py-2 text-xs sm:text-sm font-mono font-bold rounded-xl whitespace-nowrap transition-all ${
            activeTab === 'rf_ant'
              ? 'bg-sky-500 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          📡 5.8G 极化图传与 ELRS 遥控
        </button>
      </div>

      {/* Tab Content Panels */}
      {activeTab === 'arch' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Subsystem 1: Power */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold">
                ⚡
              </span>
              <h3 className="font-bold text-slate-900 dark:text-white">1. 动力系统 (Motor + ESC)</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              无刷电机由 4合1 电调 (ESC) 通过三相高频交流驱动。6S 电池通常搭配 1750~1950KV 电机；4S 搭配 2400~2750KV 电机。
            </p>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs font-mono space-y-1 text-slate-700 dark:text-slate-300">
              <div>• 协议：DShot300 / DShot600</div>
              <div>• 滤波：必须并联 35V 1000uF 低阻电容</div>
              <div>• 螺旋桨：5043 / 51466 三叶高抗震桨</div>
            </div>
          </div>

          {/* Subsystem 2: Flight Controller */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold">
                🧠
              </span>
              <h3 className="font-bold text-slate-900 dark:text-white">2. 飞行控制 (FC Avionics)</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              基于 STM32 F405 / F722 / H743 主控芯片，ICM-42688 高精度陀螺仪以 3.2kHz~8kHz 采集姿态，执行闭环 PID 姿态控制与 GPS 返航。
            </p>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs font-mono space-y-1 text-slate-700 dark:text-slate-300">
              <div>• 固件：Betaflight / INAV / ArduPilot</div>
              <div>• 传感器：陀螺仪 + 气压计 + 磁力计 + GPS</div>
              <div>• OSD：机载图形化航电数据叠加</div>
            </div>
          </div>

          {/* Subsystem 3: RF Video & Link */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
                📡
              </span>
              <h3 className="font-bold text-slate-900 dark:text-white">3. 无线电通信与图传</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              遥控采用 ExpressLRS (ELRS) 2.4G/915M 毫秒级极速响应；图传采用 5.8GHz 右旋圆极化 (RHCP) 天线抑制地面多径重影。
            </p>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs font-mono space-y-1 text-slate-700 dark:text-slate-300">
              <div>• 遥控：ELRS 2.4GHz (高达 1000Hz 刷新)</div>
              <div>• 高清图传：DJI O3 (1080p 100fps 30ms)</div>
              <div>• 模拟图传：5.8GHz 48CH 800mW</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'laws' && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-sm">
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white font-mono flex items-center gap-2">
              <span>📜 2024《无人驾驶航空器飞行管理暂行条例》核心要点</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              自 2024 年 1 月 1 日起，全国民用无人驾驶航空器进入全面法制化合规运行时代。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                一、UOM 官方实名登记（全量强制）
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                所有民用无人机（无论重量多少，包含 250 克以下微型机）所有者必须在民航局 UOM 官方平台完成实名注册登记，并将系统生成的登记标志二维码打印粘贴在航空器机身醒目位置。
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                二、适飞空域真高 120 米限值
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                管制空域以外的真高 120 米以下广播空域为微型、轻型无人机适飞空域。在适飞空域内操纵微型、轻型无人机飞行，无需申请飞行计划与操控员执照。
              </p>
            </div>

            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 space-y-2">
              <h4 className="font-bold text-sm text-red-700 dark:text-red-400">
                三、绝对禁止飞行的管制禁区
              </h4>
              <p className="text-xs text-red-600 dark:text-red-300 leading-relaxed">
                机场净空保护区、国界线、军事禁区、核设施、易燃易爆危险品仓库、大型活动现场等区域上空划设为管制空域，未经特别批准严禁飞入，违者依法拘留处罚或追究刑责。
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                四、操控员执照与等级
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                操控小型（4kg~15kg）、中型及大型无人机，或在管制空域从事商业飞行，必须考取民航局 CAAC 操纵员执照（视距内驾驶员 VLOS / 超视距驾驶员 ALOS）。
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'betaflight' && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-sm">
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white font-mono flex items-center gap-2">
              <span>⚙️ Betaflight 穿越机调参大师指南</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              掌握 PID 控制闭环、双向 DShot RPM 滤波与电机发热诊断
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/50 space-y-2">
              <h4 className="font-bold text-sm text-orange-900 dark:text-orange-300">
                P (比例增益)
              </h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                纠正当前姿态误差的主力。P 越高机身越紧绷干脆；过高会在大幅度翻滚时引发高频震颤。
              </p>
            </div>

            <div className="p-4 rounded-xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/50 space-y-2">
              <h4 className="font-bold text-sm text-sky-900 dark:text-sky-300">
                I (积分增益)
              </h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                纠正长期外力干扰与重心不平衡。I 越高轨迹越锁死；过高会使打杆操控手感显得迟钝僵硬。
              </p>
            </div>

            <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50 space-y-2">
              <h4 className="font-bold text-sm text-indigo-900 dark:text-indigo-300">
                D (微分增益)
              </h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                阻尼减震器，抑制 P 的回弹超调。⚠️ 严禁盲目大幅调大 D，D 放大高频噪声会导致电机剧烈发烫烧毁！
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rf_ant' && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-sm">
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white font-mono">
              📡 5.8GHz 圆极化天线与 ELRS 无线电射频搭配
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              为什么 FPV 穿越机图传全部采用圆极化 (RHCP/LHCP) 而非线极化？
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700 dark:text-slate-300">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                1. 消除多径效应 (Multipath Reflection)
              </h4>
              <p className="leading-relaxed">
                5.8GHz 电波遇到地面或水泥墙壁反射后，电波极化旋向会自动发生反转（RHCP 变为 LHCP）。飞行眼镜上的 RHCP 接收天线对反向 LHCP 信号具有高达 20~30dB 的抑制能力，从而彻底消除了画面重影与闪烁。
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                2. 解决大角度翻滚极化失配 (Polarization Tilt)
              </h4>
              <p className="leading-relaxed">
                穿越机花飞过程中机身持续 360° 旋转。若采用普通线极化偶极天线，当天线正交（90°夹角）时信号衰减高达 20dB（瞬间黑屏掉图传）；圆极化天线全向旋转均可维持稳定接收。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
