"""
=============================================
飞书多维表格 ← Excel 同步 API 版
=============================================

适用场景：网页后端（Flask / FastAPI / Django）
用户在前端填写飞书链接、上传 Excel，后端调用此函数完成同步。

使用方式：直接调用 sync_from_excel() 函数即可。
=============================================
"""

import json
import subprocess
import time
import re
from pathlib import Path

import openpyxl


# ─────────────────────────────────────────────
#  工具：从飞书链接中提取 token
# ─────────────────────────────────────────────

def parse_feishu_url(url: str) -> dict:
    """
    从飞书多维表格链接中提取 base_token 和 table_id。

    支持格式：
      https://xxx.feishu.cn/base/{base_token}?table={table_id}&view={view_id}
      https://xxx.feishu.cn/base/{base_token}?table={table_id}

    返回：
      { "base_token": "...", "table_id": "..." }
    """
    result = {"base_token": "", "table_id": ""}

    # 提取 base_token：/base/{token}
    m = re.search(r'/base/([A-Za-z0-9]+)', url)
    if m:
        result["base_token"] = m.group(1)

    # 提取 table_id：?table={id} 或 &table={id}
    m = re.search(r'[?&]table=([A-Za-z0-9]+)', url)
    if m:
        result["table_id"] = m.group(1)

    if not result["base_token"]:
        raise ValueError("无法从链接中解析出 base_token，请检查链接格式")
    if not result["table_id"]:
        raise ValueError("无法从链接中解析出 table_id，请检查链接格式")

    return result


# ─────────────────────────────────────────────
#  核心同步函数
# ─────────────────────────────────────────────

def sync_from_excel(
    feishu_url: str,
    excel_path: str,
    sheet_name: str = None,
    match_field_feishu: str = "商品编号 - 标品",
    match_field_excel: str = "编号",
    field_mapping: dict = None,
    clear_unmatched: bool = True,
    on_progress: callable = None,
) -> dict:
    """
    一键同步：将 Excel 数据写入飞书多维表格。

    参数
    ----
    feishu_url : str
        飞书多维表格链接，例如：
        https://xxx.feishu.cn/base/TB3xxx?table=tblxxx

    excel_path : str
        Excel 文件路径

    sheet_name : str, optional
        Excel 工作表名。为 None 时使用第一个工作表。

    match_field_feishu : str
        飞书中用于匹配记录的字段名（默认：商品编号 - 标品）

    match_field_excel : str
        Excel 中用于匹配记录的列名（默认：编号）

    field_mapping : dict, optional
        字段映射 { "飞书字段名": "Excel 列名" }
        例如：{ "供货价（集采价，30套起订）": "供货价报价" }
        默认只同步这一个字段。

    clear_unmatched : bool
        是否将飞书中但不在 Excel 里的记录目标字段设为 null

    on_progress : callable, optional
        进度回调函数，接收 (stage, message, percent) 三个参数。
        示例：on_progress("reading_excel", "读取Excel中...", 10)

    返回
    ----
    {
        "success": True/False,
        "updated": 更新记录数,
        "cleared": 清理记录数,
        "matched": 匹配成功数,
        "unmatched_in_excel": 在Excel但飞书找不到的记录数,
        "error": "错误信息（如果有）",
    }
    """
    # 默认进度回调
    if on_progress is None:
        def on_progress(stage, msg, pct): pass

    result = {
        "success": False,
        "updated": 0,
        "cleared": 0,
        "matched": 0,
        "unmatched_in_excel": 0,
        "error": "",
    }

    try:
        # ── 第 1 步：解析飞书链接 ──
        on_progress("parsing", "解析飞书链接...", 5)
        parsed = parse_feishu_url(feishu_url)
        base_token = parsed["base_token"]
        table_id = parsed["table_id"]

        # ── 第 2 步：读取 Excel ──
        on_progress("reading_excel", "读取 Excel 文件...", 10)
        wb = openpyxl.load_workbook(excel_path, data_only=True)

        if sheet_name:
            ws = wb[sheet_name]
        else:
            ws = wb.active
            sheet_name = ws.title

        rows = list(ws.iter_rows(values_only=True))
        header = [str(h).strip() if h else "" for h in rows[0]]

        # 找到 Excel 列的位置
        if match_field_excel not in header:
            raise ValueError(f"Excel 中找不到列 '{match_field_excel}'，表头：{header}")
        match_idx = header.index(match_field_excel)

        if field_mapping is None:
            field_mapping = {
                "供货价（集采价，30套起订）": "供货价报价",
            }

        # 找到映射列的位置
        mapping_indices = {}
        for feishu_f, excel_c in field_mapping.items():
            if excel_c not in header:
                raise ValueError(f"Excel 中找不到列 '{excel_c}'（映射到 '{feishu_f}'）")
            mapping_indices[feishu_f] = header.index(excel_c)

        # 构建 Excel 数据字典
        excel_data = {}
        for row in rows[1:]:
            key = str(row[match_idx]).strip() if row[match_idx] else ""
            if not key:
                continue
            vals = {}
            for feishu_f, idx in mapping_indices.items():
                vals[feishu_f] = row[idx]
            excel_data[key] = vals

        total_excel = len(excel_data)
        on_progress("reading_excel", f"Excel 读取完成，{total_excel} 条记录", 20)

        # ── 第 3 步：获取飞书记录 ──
        on_progress("fetching_feishu", "获取飞书表格数据...", 25)
        feishu_map, field_names = _fetch_feishu_records(base_token, table_id, match_field_feishu)

        # ── 第 4 步：执行更新 ──
        on_progress("updating", f"开始更新 {total_excel} 条记录...", 30)

        matched = []
        unmatched_excel = []
        for key in excel_data:
            if key in feishu_map:
                matched.append((key, feishu_map[key], excel_data[key]))
            else:
                unmatched_excel.append(key)

        result["matched"] = len(matched)
        result["unmatched_in_excel"] = len(unmatched_excel)

        updated = 0
        total_to_update = len(matched)
        for idx, (key, rid, values) in enumerate(matched):
            patch = {}
            for feishu_f, val in values.items():
                if val is not None and isinstance(val, (int, float)):
                    patch[feishu_f] = int(val) if val == int(val) else val
                elif val is not None:
                    patch[feishu_f] = val

            if patch:
                _feishu_batch_update(base_token, table_id, [rid], patch)
                updated += 1

            # 进度回调
            if total_to_update > 0:
                pct = 30 + int((idx + 1) / total_to_update * 50)
                on_progress("updating", f"更新中 {idx+1}/{total_to_update}", min(pct, 80))

            time.sleep(0.3)  # 限速

        result["updated"] = updated
        on_progress("updating", f"更新完成，共 {updated} 条", 85)

        # ── 第 5 步：清理不在 Excel 中的记录 ──
        if clear_unmatched:
            on_progress("cleaning", "清理不在 Excel 中的记录...", 88)
            excel_keys = set(excel_data.keys())
            to_clear = []
            for key, rid in feishu_map.items():
                if key not in excel_keys:
                    to_clear.append(rid)

            clear_fields = list(field_mapping.keys())
            batch_size = 10
            for i in range(0, len(to_clear), batch_size):
                batch = to_clear[i:i + batch_size]
                patch = {f: None for f in clear_fields}
                _feishu_batch_update(base_token, table_id, batch, patch)
                time.sleep(0.4)

            result["cleared"] = len(to_clear)
            on_progress("cleaning", f"已清理 {len(to_clear)} 条", 95)

        result["success"] = True
        on_progress("done", "同步完成！", 100)

    except Exception as e:
        result["error"] = str(e)
        on_progress("error", f"出错：{e}", -1)

    return result


# ─────────────────────────────────────────────
#  内部：飞书 API 调用（使用 lark-cli）
# ─────────────────────────────────────────────

def _run_lark(args: list) -> dict:
    """执行 lark-cli 命令并返回 JSON"""
    cmd = ["lark-cli"] + args
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    if proc.returncode != 0:
        raise RuntimeError(f"lark-cli 失败: {proc.stderr}")
    return json.loads(proc.stdout)


def _fetch_feishu_records(base_token: str, table_id: str, match_field: str) -> tuple:
    """
    获取飞书记录。
    返回 (key→record_id 映射, 所有字段名列表)
    """

    # 获取字段列表
    fields_resp = _run_lark([
        "base", "+field-list",
        "--base-token", base_token,
        "--table-id", table_id,
    ])
    fields = fields_resp["data"]["fields"]
    field_names = [f["name"] for f in fields]

    if match_field not in field_names:
        raise ValueError(
            f"飞书表格中找不到字段 '{match_field}'，"
            f"可用字段：{field_names}"
        )

    # 获取所有记录
    records_resp = _run_lark([
        "base", "+record-list",
        "--base-token", base_token,
        "--table-id", table_id,
        "--limit", "500",
    ])

    raw_data = records_resp["data"]["data"]
    field_id_list = records_resp["data"]["field_id_list"]
    record_id_list = records_resp["data"]["record_id_list"]

    # 找到匹配字段 ID
    match_field_id = None
    for f in fields:
        if f["name"] == match_field:
            match_field_id = f["id"]
            break
    match_idx = field_id_list.index(match_field_id)

    # 构建映射
    id_map = {}
    for i, record in enumerate(raw_data):
        if i >= len(record_id_list):
            break
        key = str(record[match_idx]).strip() if record[match_idx] else ""
        if key:
            id_map[key] = record_id_list[i]

    return id_map, field_names


def _feishu_batch_update(base_token: str, table_id: str, record_ids: list, patch: dict):
    """批量更新飞书记录"""
    payload = json.dumps({
        "record_id_list": record_ids,
        "patch": patch,
    })
    _run_lark([
        "base", "+record-batch-update",
        "--base-token", base_token,
        "--table-id", table_id,
        "--json", payload,
    ])


# ─────────────────────────────────────────────
#  命令行示例
# ─────────────────────────────────────────────

if __name__ == "__main__":
    import sys

    if len(sys.argv) < 3:
        print("用法：python feishu_excel_sync_api.py <飞书链接> <Excel路径> [工作表名]")
        print("示例：python feishu_excel_sync_api.py "
              "'https://xxx.feishu.cn/base/TB3xxx?table=tblxxx' "
              "'商品数据.xlsx' '清理结果'")
        sys.exit(1)

    feishu_url = sys.argv[1]
    excel_path = sys.argv[2]
    sheet = sys.argv[3] if len(sys.argv) > 3 else None

    def progress(stage, msg, pct):
        if pct >= 0:
            print(f"  [{pct:3d}%] {msg}")
        else:
            print(f"  [!!] {msg}")

    result = sync_from_excel(
        feishu_url=feishu_url,
        excel_path=excel_path,
        sheet_name=sheet,
        field_mapping={
            "供货价（集采价，30套起订）": "供货价报价",
        },
        clear_unmatched=True,
        on_progress=progress,
    )

    print("\n" + "=" * 40)
    if result["success"]:
        print(f"✅ 同步成功！")
        print(f"   更新 {result['updated']} 条")
        print(f"   清理 {result['cleared']} 条")
        if result["unmatched_in_excel"] > 0:
            print(f"   跳过 {result['unmatched_in_excel']} 条（Excel有但飞书无）")
    else:
        print(f"❌ 同步失败：{result['error']}")
    print("=" * 40)
