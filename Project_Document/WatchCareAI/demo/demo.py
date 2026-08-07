#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""守望 AI 垂直切片演示：把 29 个测试背后的逻辑演成一个故事。

    场景 1  边缘节点：时序特征 -> 疑似跌倒候选 -> 复核确认 -> 事件信封
    场景 2  云端入库：幂等（同一事件重复上报只存一次）
    场景 3  报警编排：L3 推送所有联系人 + 备用联系人短信
    场景 4  监护人处置：确认风险 / 标记误报 / 超时自动升级
    场景 5  事件档案：完整状态流转审计

用法：
    python demo.py            交互模式，由你决定怎么处置
    python demo.py --auto     自动播放全部三种结局
    python demo.py --fast     去掉停顿，快速播放

纯标准库，无需安装任何依赖（Python 3.9+）。
"""
from __future__ import annotations

import argparse
import json
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

# 把云端和边缘两个包挂进搜索路径（它们是独立部署单元，各有自己的依赖边界）
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "services" / "api"))
sys.path.insert(0, str(ROOT / "edge" / "runtime"))

from app.alerts.apns import SandboxApnsSender  # noqa: E402
from app.alerts.domain import Contact  # noqa: E402
from app.alerts.service import AlertService  # noqa: E402
from app.events.repository import InMemoryEventRepository  # noqa: E402
from app.events.service import EventService  # noqa: E402
from app.shared_kernel.domain_events import DomainEventBus  # noqa: E402
from app.shared_kernel.types import AcknowledgementAction  # noqa: E402

from watchcare_edge.domain.models import TemporalFeatures  # noqa: E402
from watchcare_edge.pipeline.fall_candidate import FallCandidateEngine  # noqa: E402
from watchcare_edge.pipeline.risk_verifier import RiskVerifier  # noqa: E402
from watchcare_edge.simulator.event_simulator import build_simulated_envelope  # noqa: E402

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

LINE = "─" * 66


def section(title: str) -> None:
    print(f"\n{LINE}\n  {title}\n{LINE}")


def beat(args: argparse.Namespace, seconds: float = 0.7) -> None:
    if not args.fast:
        time.sleep(seconds)


class World:
    """一套独立的云端运行时：事件服务 + 报警服务通过领域事件总线协作。"""

    def __init__(self) -> None:
        self.bus = DomainEventBus()
        self.events = EventService(InMemoryEventRepository(), self.bus)
        self.sender = SandboxApnsSender()
        self.contacts = [
            Contact("c1", "女儿（主联系人）", 1, push_token="iPhone-女儿"),
            Contact("c2", "儿子（备用联系人）", 2,
                    push_token="iPhone-儿子", phone_number="+853-6666-0000"),
        ]
        self.alerts = AlertService(self.bus, self.sender, self.contacts)
        self.contact_names = {c.contact_id: c.name for c in self.contacts}


def scene_edge(args: argparse.Namespace, full: bool) -> dict:
    section("场景 1 · 家庭边缘节点：发现疑似跌倒")
    features = TemporalFeatures(
        track_id="track_07", window_ms=5000, max_vertical_drop=0.52,
        drop_duration_ms=420, torso_angle_deg=78.0, inactivity_ms=25_000,
    )
    print("  摄像头: 客厅 camera_sim_01    目标: track_07（匿名编号，不识别身份）")
    print(f"  时序特征: 5 秒内垂直下降 {features.max_vertical_drop:.0%} 画面高度，"
          f"用时 {features.drop_duration_ms}ms，躯干角度 {features.torso_angle_deg:.0f}°，"
          f"随后静止 {features.inactivity_ms // 1000} 秒")
    beat(args)
    now_ms = int(datetime.now(timezone.utc).timestamp() * 1000)
    candidate = FallCandidateEngine().evaluate(features, detected_at_ms=now_ms)
    print(f"  >>> 疑似跌倒候选（单帧不直接报警）: "
          f"reasons={list(candidate.reasons)}, confidence={candidate.confidence:.2f}")
    beat(args)
    verified = RiskVerifier().verify(candidate, features, verified_at_ms=now_ms)
    print(f"  >>> 复核通过：倒地后 {verified.inactivity_ms // 1000} 秒未起身 "
          f"-> FALL_WITH_PROLONGED_INACTIVITY，等级 L3")
    envelope = build_simulated_envelope()
    if full:
        beat(args)
        print("  >>> 生成标准事件信封（contracts/schemas/risk-event-envelope.schema.json）:")
        print(json.dumps(envelope, ensure_ascii=False, indent=4))
    return envelope


def scene_cloud(world: World, envelope: dict):
    section("场景 2 · 云端：事件入库（幂等）")
    event, created = world.events.ingest_envelope(envelope)
    print(f"  首次上报: created={created}")
    _, created_again = world.events.ingest_envelope(envelope)
    print(f"  同一事件重复上报: created={created_again}"
          "  <- 幂等命中：不产生第二条事件，也不重复发通知")
    return event


def scene_alerts(args: argparse.Namespace, world: World) -> None:
    section("场景 3 · 报警编排：L3 紧急事件")
    print("  通知计划（severity L3 -> 所有联系人 Time Sensitive 推送 + 备用联系人短信）:")
    for task in world.alerts.tasks:
        name = world.contact_names.get(task.contact_id, task.contact_id)
        print(f"    - {task.channel.value:<5} -> {name:<12}"
              f"  [{task.interruption_level.value}] 需要确认={task.requires_ack}")
    beat(args)
    print("  APNs 沙盒发送记录:")
    for push in world.sender.sent:
        print(f"    -> {push.device_token}: {push.title} | {push.body}")


def scene_disposition_auto(world: World, event, ending: str) -> None:
    section("场景 4 · 监护人处置")
    if ending == "confirm":
        world.events.acknowledge(
            event.event_id, AcknowledgementAction.CONFIRM_RISK,
            actor="女儿（主联系人）", reason="已电话联系，老人意识清醒")
        print("  女儿确认风险，电话联系老人。")
        world.events.resolve(
            event.event_id, actor="女儿（主联系人）", reason="物业上门确认无大碍")
        print("  物业上门确认安全，事件处置完成。")
    elif ending == "false_alarm":
        world.events.acknowledge(
            event.event_id, AcknowledgementAction.FALSE_ALARM,
            actor="女儿（主联系人）", reason="是靠垫从沙发掉落")
        print("  女儿查看关键帧：是靠垫掉了，标记误报。")
    else:
        print("  （模拟时间快进 10 分钟，无人查看推送……）")
        future = datetime.now(timezone.utc) + timedelta(minutes=10)
        world.events.escalate_overdue(now=future, timeout=timedelta(minutes=5))
        print("  >>> 超过 5 分钟无人确认，事件自动升级为 ESCALATED，"
              "升级通知备用联系人。")
        world.events.acknowledge(
            event.event_id, AcknowledgementAction.HANDLING,
            actor="儿子（备用联系人）", reason="正在赶往现场",
            at=future + timedelta(seconds=45))
        print("  儿子收到升级通知，正在赶往现场。")


def scene_disposition_interactive(args: argparse.Namespace, world: World, event) -> None:
    section("场景 4 · 监护人处置（由你决定）")
    print("  你的手机弹出 Time Sensitive 推送：")
    print('  "[L3] FALL_WITH_PROLONGED_INACTIVITY — 客厅，倒地后 25 秒未起身"')
    print("    1) 确认风险（联系老人并处置）")
    print("    2) 标记误报（只是靠垫掉了）")
    print("    3) 暂不处理（超时将自动升级给备用联系人）")
    try:
        choice = input("  选择 1/2/3 [默认 3]: ").strip() or "3"
    except EOFError:
        choice = "3"
    ending = {"1": "confirm", "2": "false_alarm"}.get(choice, "timeout")
    scene_disposition_auto(world, event, ending)


def scene_archive(event) -> None:
    section("场景 5 · 事件档案：状态流转审计（设计方案 4.3）")
    print(f"  最终状态: {event.status.value}\n")
    for h in event.history:
        print(f"  {h.occurred_at:%H:%M:%S}  "
              f"{h.from_status.value:<16} -> {h.to_status.value:<16} "
              f"by {h.actor:<10} {h.reason}")


def play_episode(args: argparse.Namespace, ending: str, show_full: bool) -> None:
    world = World()
    envelope = scene_edge(args, full=show_full)
    event = scene_cloud(world, envelope)
    scene_alerts(args, world)
    scene_disposition_auto(world, event, ending)
    scene_archive(event)


TEST_MAP = [
    ("services/api/tests/test_event_state_machine.py",
     "事件状态机：合法流转 / 非法跳转拒绝 / 误报 / 幂等入库 / 超时升级", 9),
    ("services/api/tests/test_alert_policy.py",
     "报警编排：L1 只普通推送主联系人 / L2 时效推送需确认 / L3 全员推送+短信", 4),
    ("edge/runtime/tests/test_zone_engine.py",
     "危险区域：多边形判定 / 进入-停留-离开信号 / 停留计时重置 / 忽略区", 8),
    ("edge/runtime/tests/test_local_queue.py",
     "断网离线队列：入队 / 幂等拒绝重复 / 发送标记 / 重启不丢事件", 4),
    ("edge/runtime/tests/test_fall_chain.py",
     "跌倒规则链：跌倒->候选->复核 / 正常坐下不误报 / 起身不升级 / 信封格式", 4),
]


def print_test_map() -> None:
    section("附录 · 29 个测试各自在守护什么")
    total = 0
    for path, desc, count in TEST_MAP:
        total += count
        print(f"  [{count:>2} 个用例] {path}\n             {desc}")
    print(f"\n  合计 {total} 个用例。运行方式：")
    print("    cd services/api   && python -m unittest discover -s tests")
    print("    cd edge/runtime   && python -m unittest discover -s tests")


def banner() -> None:
    print("=" * 66)
    print("  守望 AI（WatchCare AI）· 端到端垂直切片演示")
    print("  边缘检测 -> 云端入库 -> 分级报警 -> 人工处置 -> 审计闭环")
    print("=" * 66)


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="守望 AI 垂直切片演示")
    parser.add_argument("--auto", action="store_true", help="自动播放三种结局")
    parser.add_argument("--fast", action="store_true", help="去掉停顿")
    args = parser.parse_args(argv)
    banner()
    if args.auto:
        endings = [
            ("confirm", "结局 A · 主联系人确认风险并处置完成"),
            ("false_alarm", "结局 B · 标记误报"),
            ("timeout", "结局 C · 超时未确认，自动升级，备用联系人接手"),
        ]
        for index, (ending, title) in enumerate(endings, start=1):
            print(f"\n{'#' * 66}\n  第 {index} 幕 · {title}\n{'#' * 66}")
            play_episode(args, ending, show_full=(index == 1))
    else:
        world = World()
        envelope = scene_edge(args, full=True)
        event = scene_cloud(world, envelope)
        scene_alerts(args, world)
        scene_disposition_interactive(args, world, event)
        scene_archive(event)
    print_test_map()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
