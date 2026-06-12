# ANTIGRAVITY_FIX_PROMPT.md

# Prompt Fix Logic — Collapse từ Normal Mode sang Vòng Tranh Slot

Hãy đọc code hiện tại sau lần triển khai Game Logic V2 trước đó, đặc biệt:

```txt
lib/game-actions.ts
lib/types.ts
app/play/page.tsx
app/admin/page.tsx
app/projector/page.tsx
```

Mục tiêu lần sửa này là vá các lỗ hổng khi một câu hỏi ở `normal mode` làm số người sống trả lời đúng giảm đột ngột xuống 0, 1, 2 hoặc 3 người.

Không viết lại toàn bộ game. Chỉ sửa logic cần thiết và giữ nguyên các chức năng hiện có đang hoạt động tốt.

## 1. Không thay đổi cơ chế chọn độ khó câu hỏi

Phải giữ nguyên cơ chế Admin đang dùng để chọn độ khó `easy | medium | hard`.

Không hard-code câu đầu hoặc câu cuối thành câu dễ. Không thay đổi UI hoặc logic chọn độ khó nếu không cần thiết. Việc chọn độ khó chỉ ảnh hưởng câu hỏi được bốc, không ảnh hưởng quy tắc normal/survival/tranh slot.

## 2. Phân biệt rõ hai trường hợp

### Trường hợp A — Bắt đầu câu đã có `aliveCount <= 5`

Đây là cơ chế survival hiện tại đã triển khai. Giữ nguyên logic đã có:

- Tắt hồi sinh ngay từ đầu câu.
- Xử lý các case top 5 / top 4 theo spec hiện tại.
- Không áp dụng nhánh collapse mới mô tả bên dưới.

### Trường hợp B — Bắt đầu câu có `aliveCount > 5`

Đây vẫn là `normal mode`.

Nếu sau khi chấm đáp án, số người đang sống trước câu hỏi trả lời đúng chỉ còn:

```ts
aliveCorrect.length <= 3
```

thì không áp dụng normal elimination quota theo cách cũ nữa. Thay vào đó, chuyển sang cơ chế chốt winner / tranh slot.

## 3. Snapshot bắt buộc trong `revealAnswer`

Trước khi thay đổi trạng thái player, phải tạo snapshot:

```ts
aliveBefore
deadBefore
aliveCorrect
aliveWrong
deadCorrectCandidates
```

Trong đó:

- `aliveBefore`: player có `status === "alive"` trước khi reveal.
- `deadBefore`: player có `status === "dead"` trước khi reveal.
- `aliveCorrect`: người trong `aliveBefore` trả lời đúng.
- `aliveWrong`: người trong `aliveBefore` trả lời sai hoặc không trả lời.
- `deadCorrectCandidates`: người trong `deadBefore` trả lời đúng và có `answerTime`.

Không để player vừa bị đổi trạng thái ở bước trước bị tính nhầm sang nhóm khác trong cùng một reveal.

## 4. Hồi sinh ở câu collapse

Nếu câu bắt đầu ở normal mode và `aliveCorrect.length < 3`, vẫn tính hồi sinh của chính câu đó theo `resurrectionCount` hiện tại:

1. Lọc `deadCorrectCandidates`.
2. Sắp xếp theo `answerTime` tăng dần.
3. Lấy tối đa `resurrectionCount`.
4. Chuyển những người đó từ `dead` sang `alive`.
5. Ghi vào `resurrectedThisRound`.

Nhưng:

- Người vừa hồi sinh không được trở thành `winner` trong cùng câu.
- Người vừa hồi sinh chỉ được thêm vào nhóm tranh slot ở câu sau.
- Từ câu tiếp theo, hồi sinh phải bị khóa hoàn toàn.

Nếu toàn bộ người chết trả lời sai hoặc không trả lời:

```ts
resurrectedThisRound = []
```

Không ai hồi sinh.

## 5. Xử lý khi `aliveCorrect.length === 3`

- 3 người trong `aliveCorrect` chuyển thành `winner`.
- Những người còn lại không phải winner.
- Set:

```ts
phase = "finished"
winnerSlotsRemaining = 0
```

- Game kết thúc ngay.
- Người dead trả lời đúng không ảnh hưởng kết quả.
- Tốt nhất bỏ qua apply hồi sinh vì đã đủ Top 3.

Ví dụ:

```txt
10 alive trước câu
3 đúng
7 sai
1 dead trả lời đúng
```

Kết quả:

```txt
3 người sống đúng = Top 3 winner
Game finished
Người dead trả lời đúng không ảnh hưởng kết quả
```

## 6. Xử lý khi `aliveCorrect.length === 2`

- 2 người đúng chuyển thành `winner`.
- Còn thiếu 1 slot.
- Vẫn tính hồi sinh của câu đó.
- Nhóm tranh slot cuối gồm:

```ts
aliveWrong + resurrectedThisRound
```

- Không thêm toàn bộ người chết cũ.
- Chỉ người vừa hồi sinh trong chính câu đó được tham gia.

Set:

```ts
mode = "survival"
winnerSlotsRemaining = 1
survivalContestants = unique(aliveWrong + resurrectedThisRound)
resurrectionCount = 0
phase = "reveal"
```

Từ câu sau:

- Chỉ `survivalContestants` được trả lời.
- Không còn hồi sinh.
- Người đúng nhanh nhất lấy slot cuối.
- Khi đủ 3 winner, set `phase = "finished"`.

## 7. Xử lý khi `aliveCorrect.length === 1`

- Người đúng chuyển thành `winner`.
- Còn thiếu 2 slot.
- Vẫn tính hồi sinh của câu đó.
- Nhóm tranh 2 slot gồm:

```ts
aliveWrong + resurrectedThisRound
```

Set:

```ts
mode = "survival"
winnerSlotsRemaining = 2
survivalContestants = unique(aliveWrong + resurrectedThisRound)
resurrectionCount = 0
phase = "reveal"
```

Từ câu sau dùng luật tranh slot:

- Nếu có ít nhất 2 người đúng: lấy 2 người đúng nhanh nhất, đủ 3 winner, finished.
- Nếu chỉ có 1 người đúng: người đó thành winner; người sai bị loại khỏi nhóm tranh; người đúng nhưng chậm hơn vẫn tiếp tục nếu còn slot; tiếp tục câu sau để tranh slot cuối.
- Nếu không ai đúng: không loại ai, giữ nguyên nhóm và hỏi tiếp câu khác.

## 8. Xử lý khi `aliveCorrect.length === 0`

Đây là case đặc biệt khi toàn bộ người sống đều trả lời sai hoặc không trả lời.

Ví dụ:

```txt
5 alive đều sai
1 dead trả lời đúng và được hồi sinh
```

Kết quả:

```txt
0 winner
6 survivalContestants
```

Trong đó:

```ts
survivalContestants = aliveWrong + resurrectedThisRound
```

Set:

```ts
mode = "survival"
winnerSlotsRemaining = 3
resurrectionCount = 0
phase = "reveal"
```

Người vừa hồi sinh:

- Được chuyển thành `alive`.
- Được thêm vào `survivalContestants`.
- Không được trở thành winner ngay.

Người chết cũ không được hồi sinh:

- Vẫn `dead`.
- Không được tham gia.

## 9. Luật đặc biệt cho nhánh `aliveCorrect.length === 0`

Chỉ trong nhánh này, mỗi câu chốt sau đó chỉ lấy đúng 1 winner.

Mỗi câu:

1. Chỉ `survivalContestants` được trả lời.
2. Lọc người trả lời đúng.

### Nếu không ai đúng

- Không loại ai.
- Giữ nguyên nhóm.
- Hỏi tiếp câu khác.

### Nếu có ít nhất 1 người đúng

- Sắp người đúng theo `answerTime` tăng dần.
- Chọn đúng 1 người nhanh nhất thành `winner`.
- Những người trả lời sai hoặc không trả lời bị loại khỏi nhóm tranh.
- Những người cũng trả lời đúng nhưng chậm hơn vẫn tiếp tục tranh ở câu sau.
- Giảm `winnerSlotsRemaining` đi 1.

Ví dụ:

```txt
8 người tranh 3 slot
3 đúng
5 sai
```

Kết quả:

```txt
1 người đúng nhanh nhất thành winner
5 người sai bị loại
2 người đúng chậm hơn tiếp tục tranh 2 slot còn lại
```

Nếu câu tiếp theo 2 contestant đều đúng, vẫn chỉ lấy 1 người nhanh nhất thành winner thứ hai; người còn lại tiếp tục tranh slot cuối.

## 10. Luật tranh slot thông thường khi đã có 1 hoặc 2 winner

Đây là luật dùng cho nhánh `aliveCorrect.length === 1` hoặc `=== 2`.

Mỗi câu:

```ts
slotsRemaining = 3 - winnerCount
correctContestants = contestant trả lời đúng
wrongContestants = contestant trả lời sai hoặc không trả lời
```

### Nếu `correctContestants.length === 0`

- Không loại ai.
- Giữ nguyên nhóm.
- Hỏi tiếp câu mới.

### Nếu `correctContestants.length < slotsRemaining`

- Tất cả người đúng thành `winner`.
- Người sai bị loại khỏi nhóm tranh.
- Nếu vẫn thiếu slot, tiếp tục với những người hợp lệ còn lại.

### Nếu `correctContestants.length === slotsRemaining`

- Tất cả người đúng thành `winner`.
- Người sai bị loại.
- Đủ 3 winner.
- `phase = "finished"`.

### Nếu `correctContestants.length > slotsRemaining`

- Sắp người đúng theo `answerTime`.
- Lấy đúng số lượng `slotsRemaining` người nhanh nhất làm `winner`.
- Người sai bị loại.
- `phase = "finished"`.

Ví dụ:

```txt
8 người tranh 2 slot
3 đúng
5 sai
```

Nếu đang có 1 winner:

```txt
lấy 2 người đúng nhanh nhất
5 người sai bị loại
đủ Top 3
finished
```

Ví dụ:

```txt
8 người tranh 2 slot
1 đúng
7 sai
```

Kết quả:

```txt
1 người đúng thành winner
7 sai bị loại
nếu vẫn thiếu 1 slot và không còn contestant, dùng fallback ở mục 14
```

## 11. Quy tắc loại trong câu tranh slot

Khi có ít nhất 1 người trả lời đúng:

- Người sai hoặc không trả lời bị loại khỏi `survivalContestants`.
- Người đúng được xét theo tốc độ và số slot còn thiếu.

Khi không có ai đúng:

- Không loại cả nhóm.
- Lặp lại với câu hỏi mới.

## 12. Chỉ `survivalContestants` được trả lời

Trong survival / slot-decider mode, điều kiện submit phải là:

```ts
gameState.mode === "survival"
&& player.status === "alive"
&& gameState.survivalContestants.includes(playerKey)
```

Người `winner`, `dead`, hoặc không nằm trong `survivalContestants` không được submit.

## 13. Cập nhật `survivalContestants` sau mỗi câu

Sau mỗi reveal trong vòng tranh slot:

- Xóa người vừa thành `winner`.
- Xóa người trả lời sai hoặc không trả lời nếu trong câu có ít nhất 1 người đúng.
- Giữ người đúng nhưng chưa được chọn do chậm hơn, nếu game vẫn chưa đủ winner.
- Nếu không ai đúng, giữ nguyên toàn bộ nhóm.
- Luôn loại trùng bằng `Set`.

## 14. Fallback an toàn

Nếu xảy ra data bất thường:

```ts
survivalContestants.length === 0
&& winnerCount < 3
```

thì:

- Không crash.
- Không tự tạo winner giả.
- Không đưa người dead cũ quay lại.
- Giữ `phase = "reveal"`.
- Hiển thị cảnh báo trên Admin: `Không còn người hợp lệ để tranh các slot còn thiếu.`
- Cho Admin reset game hoặc xử lý thủ công.

## 15. UI `/play`

### Người `winner`

```txt
Bạn đã chắc suất chiến thắng 🎉
```

Không cho trả lời tiếp.

### Người trong `survivalContestants`

```txt
Bạn đang tranh suất chiến thắng còn lại.
Hãy trả lời đúng và nhanh nhất.
```

### Người vừa hồi sinh và vào nhóm tranh slot

```txt
Bạn đã được hồi sinh và đang tranh suất Top 3.
```

### Người bị loại khỏi nhóm tranh

```txt
Bạn đã bị loại khỏi vòng tranh suất.
```

## 16. UI `/projector`

Khi chuyển từ normal sang slot-decider, hiển thị:

```txt
VÒNG TRANH SUẤT TOP 3
Đã có: X winner
Còn thiếu: Y slot
Số người đang tranh: Z
```

Nếu người vừa hồi sinh được thêm vào nhóm:

```txt
Hồi sinh vòng này: ...
Những người này sẽ tiếp tục tranh suất Top 3.
```

Nếu không ai đúng trong câu tranh:

```txt
Chưa có người giành được suất.
Nhóm hiện tại sẽ tiếp tục với câu hỏi tiếp theo.
```

## 17. UI `/admin`

Admin cần thấy:

- `winnerCount`
- `winnerSlotsRemaining`
- `survivalContestants`
- `resurrectedThisRound`
- Nhóm bị loại khỏi vòng tranh
- Mode hiện tại

Khi vào slot-decider:

- Disable hồi sinh.
- Không cho chỉnh `resurrectionCount`.
- Giữ nguyên chức năng chọn độ khó câu tiếp theo: `easy`, `medium`, `hard`.

## 18. Test cases bắt buộc

### Collapse từ normal mode

1. 10 alive, 3 đúng, 7 sai → 3 winner, finished.
2. 10 alive, 2 đúng, 8 sai, không ai hồi sinh → 2 winner, 8 contestants tranh 1 slot.
3. 10 alive, 2 đúng, 8 sai, 1 người hồi sinh → 2 winner, 9 contestants tranh 1 slot; người hồi sinh không là winner.
4. 10 alive, 1 đúng, 9 sai → 1 winner, 9 contestants tranh 2 slot.
5. 10 alive, 0 đúng, không ai hồi sinh → 0 winner, 10 contestants, mỗi câu sau chỉ lấy 1 winner.
6. 5 alive đều sai, 1 dead hồi sinh → 0 winner, 6 contestants, khóa hồi sinh từ câu sau.
7. Người dead trả lời sai hết → `resurrectedThisRound = []`.

### Tranh slot thông thường

8. 8 contestants tranh 2 slot, 3 đúng, 5 sai → lấy 2 đúng nhanh nhất, 5 sai bị loại, finished.
9. 8 contestants tranh 2 slot, 1 đúng, 7 sai → 1 người thành winner, 7 sai bị loại, kiểm tra fallback nếu không còn contestant mà vẫn thiếu 1 slot.
10. Contestants tranh slot, không ai đúng → không loại ai, giữ nguyên nhóm, hỏi tiếp.

### Nhánh 0 người đúng ban đầu

11. 8 contestants tranh 3 slot, 3 đúng, 5 sai → chỉ 1 người đúng nhanh nhất thành winner; 5 sai bị loại; 2 người đúng chậm hơn tiếp tục.
12. Câu tiếp theo 2 contestant đều đúng → chỉ 1 người nhanh nhất thành winner; người còn lại tranh slot cuối.
13. Câu tiếp theo không ai đúng → giữ nguyên nhóm, hỏi tiếp.

## 19. Yêu cầu kỹ thuật

- Không phá logic chọn độ khó.
- Không viết lại UI không cần thiết.
- Không cho người vừa hồi sinh thành winner ngay.
- Không kéo toàn bộ người chết cũ vào vòng cuối.
- Dùng multi-location Firebase update nếu có thể.
- Đảm bảo backward compatibility nếu Firebase thiếu field mới.
- Liệt kê file đã sửa sau khi hoàn thành.
- Nêu rõ test case đã kiểm tra.
