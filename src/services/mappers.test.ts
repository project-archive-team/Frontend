/**
 * 날짜 표기 회귀 검증.
 *
 * UTC 기준으로 자르면 한국 시간 자정~오전 9시 사이에 하루 전 날짜가 찍힌다.
 * 실제로 방금 만든 프로젝트가 "최종 수정: 어제"로 보였다.
 *
 * 실행: npx tsx src/services/mappers.test.ts   (별도 러너 없이 assert만 쓴다)
 */
import assert from 'node:assert/strict';
import { formatDate } from './mappers';

const KST_EARLY_MORNING = '2026-08-13T15:39:36Z'; // = 2026-08-14 00:39 KST

function run() {
  const offsetMinutes = new Date(KST_EARLY_MORNING).getTimezoneOffset();

  // 실행 환경 시간대 기준으로 기대값을 만든다 — CI가 UTC여도 통과해야 한다.
  const local = new Date(KST_EARLY_MORNING);
  const expected = `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, '0')}-${String(
    local.getDate()
  ).padStart(2, '0')}`;

  assert.equal(formatDate(KST_EARLY_MORNING), expected);

  // 한국(UTC+9, offset -540)에서는 UTC로 자른 값과 달라야 한다.
  if (offsetMinutes === -540) {
    assert.equal(formatDate(KST_EARLY_MORNING), '2026-08-14');
    assert.notEqual(formatDate(KST_EARLY_MORNING), KST_EARLY_MORNING.slice(0, 10));
  }

  assert.equal(formatDate(null), '-');
  assert.equal(formatDate('그럴듯하지 않은 값'), '-');

  console.log('mappers: 날짜 표기 검증 통과');
}

run();
