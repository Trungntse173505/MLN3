# GAME_LOGIC_V2_SPEC.md

# Đặc tả Logic Game V2 — Game Trắc nghiệm Đúng/Sai Real-time HCM202

Tài liệu này mô tả phiên bản luật chơi mới cho website game trắc nghiệm Đúng/Sai real-time. Mục tiêu là thay thế cơ chế hybrid cũ, trong đó người sống trả lời thủ công ngoài đời, bằng cơ chế tự động hóa hoàn toàn trên website để dễ kiểm soát, công bằng hơn và giảm lộn xộn trong lớp.

---

## 1. Tổng quan hệ thống

Website vẫn giữ 3 màn hình vai trò chính:

### `/admin`

Màn quản lý dành cho giáo viên/MC.

Chức năng chính:

- Reset game.
- Bắt đầu game.
- Chuyển câu hỏi.
- Công bố đáp án.
- Theo dõi số người sống, chết, winner.
- Theo dõi số người đã trả lời.
- Theo dõi ai bị loại, ai hồi sinh, ai chắc suất thắng.
- Cấu hình số người hồi sinh ở giai đoạn thường.

Admin không cần tự loại người chơi thủ công nữa. Việc loại, hồi sinh và chốt winner do hệ thống tự xử lý.

---

### `/play`

Màn người chơi truy cập bằng website trên điện thoại.

Người chơi có thể thấy:

- Form nhập tên ở lobby.
- Câu hỏi hiện tại.
- Hai nút Đúng / Sai khi được phép trả lời.
- Trạng thái cá nhân:
  - Đang sống.
  - Đã bị loại.
  - Đang tranh hồi sinh.
  - Đang tranh suất thắng ở vòng sinh tồn.
  - Đã chắc suất thắng.
  - Thắng chung cuộc.

Thay đổi quan trọng so với logic cũ:

- Người còn sống cũng trả lời trực tiếp trên `/play`.
- Không còn cơ chế người sống trả lời thủ công ngoài đời.
- Người chết chỉ được tranh hồi sinh ở giai đoạn thường.
- Khi vào vòng sinh tồn, hồi sinh bị tắt hoàn toàn.

---

### `/projector`

Màn máy chiếu cho cả lớp xem.

Hiển thị:

- Link hoặc QR vào `/play`.
- Câu hỏi hiện tại.
- Số người đã trả lời / số người cần trả lời.
- Số người sống, chết, winner.
- Đáp án đúng và giải thích khi reveal.
- Danh sách người bị loại vòng này.
- Danh sách người được hồi sinh vòng này.
- Danh sách người chắc suất thắng.
- Danh sách top 3 winner khi game kết thúc.

---

## 2. Trạng thái người chơi

Nên hỗ trợ 3 trạng thái chính:

```ts
type PlayerStatus = "alive" | "dead" | "winner";
```

### `alive`

Người chơi còn trong game và phải trả lời câu hỏi.

Ở giai đoạn thường, `alive` được xét loại.

Ở vòng sinh tồn, `alive` là người đang tranh suất thắng.

---

### `dead`

Người chơi đã bị loại.

Ở giai đoạn thường:

- Người `dead` vẫn được trả lời để tranh hồi sinh.
- Nếu trả lời đúng và đủ nhanh, có thể chuyển lại thành `alive`.

Ở vòng sinh tồn:

- Người `dead` không còn được trả lời.
- Hồi sinh đã tắt.

---

### `winner`

Người chơi đã chắc suất thắng trong vòng sinh tồn.

Người `winner`:

- Không cần trả lời tiếp.
- Không bị loại nữa.
- Được tính vào top winner cuối game.
- Trên `/play` nên hiển thị trạng thái đã chắc suất thắng.

---

## 3. Game phases

Vẫn có thể giữ các phase cũ:

```ts
type GamePhase = "lobby" | "question" | "reveal" | "finished";
```

Nên bổ sung thêm mode logic:

```ts
type GameMode = "normal" | "survival";
```

### `normal`

Giai đoạn thường, áp dụng khi số người sống trước khi bắt đầu câu hỏi lớn hơn 5.

### `survival`

Vòng sinh tồn, áp dụng khi số người sống trước khi bắt đầu câu hỏi nhỏ hơn hoặc bằng 5.

---

## 4. Giai đoạn Lobby

### Khi reset game

- `phase = "lobby"`.
- `mode = "normal"`.
- Tất cả người chơi mới vào có `status = "alive"`.
- Xóa answer, answerTime, eliminatedThisRound, resurrectedThisRound, winnersThisRound.
- Reset danh sách câu hỏi đã dùng nếu cần.
- Reset winner count.

### `/play`

Người chơi nhập tên, sau đó chờ game bắt đầu.

### `/projector`

Hiển thị link/QR tham gia, số người tham gia và danh sách người chơi.

### `/admin`

Hiển thị danh sách người chơi và nút bắt đầu câu đầu tiên.

---

## 5. Giai đoạn thường — `mode = "normal"`

Áp dụng khi số người `alive` trước khi bắt đầu câu hỏi lớn hơn 5.

### 5.1. Ai được trả lời?

Trong giai đoạn thường:

- Người `alive` phải trả lời Đúng/Sai trên `/play`.
- Người `dead` cũng được trả lời Đúng/Sai để tranh hồi sinh.
- Người `winner` chưa xuất hiện trong giai đoạn này.

### 5.2. Quota loại

Câu đầu tiên:

```ts
eliminationQuota = 5;
```

Từ câu thứ hai trở đi:

```ts
eliminationQuota = 2;
```

Quota là số người bị loại tối thiểu, không phải tối đa.

### 5.3. Luật loại người sống

Chỉ xét những người có `status === "alive"` tại thời điểm bắt đầu câu hỏi.

Khi reveal:

1. Người sống trả lời sai bị loại.
2. Người sống không trả lời cũng xem như sai và bị loại.
3. Nếu số người bị loại chưa đủ `eliminationQuota`, loại thêm người trả lời đúng nhưng chậm nhất.
4. Nếu số người sai/không trả lời vượt quota, vẫn loại hết nhóm sai/không trả lời.

Ví dụ câu 1 cần loại tối thiểu 5:

- 8 người sai → loại cả 8.
- 3 người sai → loại 3 người sai + 2 người đúng chậm nhất.
- 0 người sai → loại 5 người đúng chậm nhất.

Ví dụ từ câu 2 trở đi cần loại tối thiểu 2:

- 4 người sai → loại cả 4.
- 1 người sai → loại 1 người sai + 1 người đúng chậm nhất.
- 0 người sai → loại 2 người đúng chậm nhất.

### 5.4. Luật hồi sinh

Chỉ xét những người có `status === "dead"` tại thời điểm bắt đầu câu hỏi.

Khi reveal:

1. Lọc người chết trả lời đúng.
2. Sắp xếp theo thời gian trả lời nhanh nhất.
3. Lấy tối đa `resurrectionCount` người.
4. Chuyển họ từ `dead` sang `alive`.
5. Lưu danh sách vào `resurrectedThisRound`.

Lưu ý bắt buộc:

- Người vừa bị loại ở câu hiện tại không được hồi sinh ngay trong cùng câu.
- Người vừa hồi sinh không bị xét loại trong cùng câu.
- Cần tách snapshot người sống và người chết tại thời điểm bắt đầu câu hỏi hoặc ngay trước khi reveal.

### 5.5. Chuyển sang vòng sinh tồn

Sau khi reveal và áp dụng loại/hồi sinh:

- Nếu số người `alive` sau reveal nhỏ hơn hoặc bằng 5, câu kế tiếp sẽ vào `mode = "survival"`.
- Nếu đầu câu có 6 người sống thì câu đó vẫn là `normal`.
- Dù sau reveal còn 5 người, hồi sinh của câu đó vẫn được tính bình thường.
- Sang câu kế tiếp mới tắt hồi sinh.

---

## 6. Vòng sinh tồn — `mode = "survival"`

Áp dụng khi bắt đầu câu hỏi mà số người `alive` nhỏ hơn hoặc bằng 5.

Mục tiêu: tìm đủ 3 người `winner`.

### 6.1. Luật chung

Trong survival mode:

- Hồi sinh tắt hoàn toàn.
- Người `dead` không được trả lời.
- Người `winner` không cần trả lời nữa.
- Chỉ người `alive` còn đang tranh suất thắng mới trả lời.
- Game kết thúc khi có đủ 3 người `winner`.

### 6.2. Cách hiểu slot thắng

Luôn tính:

```ts
winnerCount = số người có status === "winner"
slotsRemaining = 3 - winnerCount
contestants = những người có status === "alive"
```

Chỉ nhóm `contestants` trả lời câu hỏi.

---

## 7. Survival mode khi còn 5 người và chưa có winner

Giả sử bắt đầu survival mode có 5 người `alive`, `winnerCount = 0`, `slotsRemaining = 3`.

### Case 1: 5 đúng, 0 sai

Tất cả đều đúng.

Xử lý:

- Loại 1 người đúng chậm nhất.
- Người đó chuyển sang `dead`.
- Còn 4 người `alive`.
- Chưa có winner.
- Tiếp tục câu sau.

### Case 2: 4 đúng, 1 sai

Xử lý:

- Loại người sai.
- Người sai chuyển sang `dead`.
- Còn 4 người `alive`.
- Chưa có winner.
- Tiếp tục câu sau.

### Case 3: 3 đúng, 2 sai

Xử lý:

- 3 người đúng chuyển thành `winner`.
- Game kết thúc.
- 2 người sai chuyển thành `dead` hoặc giữ không quan trọng vì phase đã `finished`, nhưng nên set `dead` để rõ ràng.

### Case 4: 2 đúng, 3 sai

Xử lý:

- 2 người đúng chuyển thành `winner`.
- 3 người sai vẫn là `alive` để tranh 1 slot còn lại.
- `slotsRemaining = 1`.
- Tiếp tục câu sau với 3 người này.

### Case 5: 1 đúng, 4 sai

Xử lý:

- 1 người đúng chuyển thành `winner`.
- 4 người sai vẫn là `alive` để tranh 2 slot còn lại.
- `slotsRemaining = 2`.
- Tiếp tục câu sau với 4 người này.

### Case 6: 0 đúng, 5 sai

Xử lý:

- Không ai thành winner.
- Không ai bị loại thêm.
- Cả 5 người tiếp tục câu sau.

---

## 8. Survival mode khi còn 4 người và chưa có winner

Giả sử có 4 người `alive`, `winnerCount = 0`, `slotsRemaining = 3`.

### Case 1: 4 đúng

Xử lý:

- Loại 1 người đúng chậm nhất.
- 3 người còn lại chuyển thành `winner`.
- Game kết thúc.

### Case 2: 3 đúng, 1 sai

Xử lý:

- 3 người đúng chuyển thành `winner`.
- Game kết thúc.

### Case 3: 2 đúng, 2 sai

Xử lý:

- 2 người đúng chuyển thành `winner`.
- 2 người sai vẫn là `alive` để tranh 1 slot còn lại.
- Tiếp tục câu sau.

### Case 4: 1 đúng, 3 sai

Xử lý:

- 1 người đúng chuyển thành `winner`.
- 3 người sai vẫn là `alive` để tranh 2 slot còn lại.
- Tiếp tục câu sau.

### Case 5: 0 đúng

Xử lý:

- Không ai thành winner.
- Không ai bị loại thêm.
- Cả 4 người tiếp tục câu sau.

---

## 9. Survival mode khi đã có winner

Ví dụ đã có 1 hoặc 2 người `winner`, các người còn lại `alive` đang tranh slot còn thiếu.

Mỗi câu:

1. Chỉ người `alive` trả lời.
2. Tính `slotsRemaining = 3 - winnerCount`.
3. Lọc người trả lời đúng trong nhóm `alive`.

### Nếu số người đúng bằng `slotsRemaining`

- Tất cả người đúng chuyển thành `winner`.
- Đủ 3 winner → `phase = "finished"`.

### Nếu số người đúng lớn hơn `slotsRemaining`

- Chọn những người đúng nhanh nhất cho đủ slot.
- Những người được chọn chuyển thành `winner`.
- Đủ 3 winner → `phase = "finished"`.

### Nếu số người đúng nhỏ hơn `slotsRemaining` nhưng lớn hơn 0

- Tất cả người đúng chuyển thành `winner`.
- Những người sai vẫn là `alive` để tranh slot còn thiếu.
- Tiếp tục câu sau.

### Nếu không ai đúng

- Không ai thành winner.
- Không ai bị loại thêm.
- Nhóm `alive` tiếp tục câu sau.

---

## 10. Xử lý không trả lời

Trong toàn bộ game:

- Không trả lời được xem như trả lời sai.
- Ở giai đoạn thường, người sống không trả lời bị loại.
- Ở survival mode, người không trả lời được xếp vào nhóm sai.

---

## 11. Gợi ý schema Firebase

### `gameState`

```ts
interface GameState {
  phase: "lobby" | "question" | "reveal" | "finished";
  mode: "normal" | "survival";

  currentQuestion: number;
  activeQuestionId: number | null;
  questionStartTime: number | null;

  resurrectionCount: number;

  usedQuestionIds: Record<string, boolean>;

  eliminatedThisRound: string[];
  resurrectedThisRound: string[];
  winnersThisRound: string[];

  eliminationQuota: number;
  winnerSlotsRemaining: number;

  survivalContestants: string[];

  finalRound?: boolean; // optional legacy compatibility
}
```

### `players`

```ts
interface Player {
  name: string;
  status: "alive" | "dead" | "winner";
  answer: boolean | null;
  answerTime: number | null;
  joinedAt: number;

  lastResult?: "correct" | "wrong" | "no_answer";
  lastAction?:
    | "waiting"
    | "survived"
    | "eliminated"
    | "resurrected"
    | "winner_locked";
}
```

---

## 12. UI yêu cầu cho `/play`

### Lobby

- Form nhập tên.
- Sau khi nhập tên, hiển thị chờ game bắt đầu.

### Người `alive` ở normal mode

Hiển thị:

- Câu hỏi.
- Nút Đúng / Sai.
- Text: "Bạn đang còn sống. Hãy trả lời để tiếp tục sống sót."

### Người `dead` ở normal mode

Hiển thị:

- Câu hỏi.
- Nút Đúng / Sai.
- Text: "Bạn đã bị loại, nhưng vẫn có thể tranh hồi sinh. Trả lời đúng và nhanh nhất để quay lại game."

### Người `alive` ở survival mode

Hiển thị:

- Câu hỏi.
- Nút Đúng / Sai.
- Text: "Vòng sinh tồn. Trả lời đúng để giành suất thắng."

Nếu đã có winner và người này đang tranh slot cuối:

- Text: "Bạn đang tranh suất thắng còn lại. Trả lời đúng và nhanh nhất để vào top 3."

### Người `winner`

Không hiển thị nút trả lời.

Text:

- "Bạn đã chắc suất chiến thắng 🎉"
- "Hãy chờ game tìm đủ top 3."

### Người `dead` ở survival mode

Không hiển thị nút trả lời.

Text:

- "Bạn đã bị loại."
- "Vòng sinh tồn đã bắt đầu nên hồi sinh đã đóng."

---

## 13. UI yêu cầu cho `/projector`

### Lobby

- Hiển thị tên game.
- Hiển thị link/QR vào `/play`.
- Hiển thị số người tham gia.
- Hiển thị danh sách người chơi.

### Question phase

- Hiển thị câu hỏi.
- Hiển thị số người đã trả lời / số người cần trả lời.
- Hiển thị số người sống/chết/winner.
- Nếu `mode = "survival"`, hiển thị badge: "VÒNG SINH TỒN — TÌM ĐỦ 3 NGƯỜI THẮNG".

### Reveal ở normal mode

Hiển thị:

- Đáp án đúng.
- Giải thích.
- Người bị loại vòng này.
- Người hồi sinh vòng này.
- Số người sống còn lại.
- Nếu có người bị loại vì đúng nhưng chậm, hiển thị lý do rõ ràng.

### Reveal ở survival mode

Hiển thị:

- Đáp án đúng.
- Người trả lời đúng.
- Người trả lời sai / không trả lời.
- Người đã chắc suất winner.
- Còn thiếu bao nhiêu slot thắng.
- Nếu kết thúc, hiển thị top 3 winner.

### Finished

Hiển thị lớn:

- "TOP 3 CHIẾN THẮNG"
- Danh sách 3 người `winner`.

---

## 14. UI yêu cầu cho `/admin`

Admin cần thấy:

- Phase hiện tại.
- Mode hiện tại: normal / survival.
- Câu hiện tại.
- Số người sống.
- Số người chết.
- Số winner.
- Số người đã trả lời.
- Danh sách người chơi và trạng thái.
- Đáp án từng người nếu cần.
- Người bị loại vòng này.
- Người hồi sinh vòng này.
- Người chắc suất thắng vòng này.
- Nút reveal answer.
- Nút next question.
- Nút reset game.

Khi vào survival mode:

- Tự động khóa `resurrectionCount = 0`.
- UI hiện: "Hồi sinh đã tắt vì game đã vào vòng sinh tồn."

---

## 15. Các test case bắt buộc

### Normal mode

1. Câu 1, 8 người sai → loại 8.
2. Câu 1, 3 người sai → loại 3 sai + 2 đúng chậm nhất.
3. Câu 1, 0 người sai → loại 5 đúng chậm nhất.
4. Câu 2, 1 người sai → loại 1 sai + 1 đúng chậm nhất.
5. Người chết trả lời đúng nhanh nhất được hồi sinh.
6. Người vừa bị loại không được hồi sinh ngay cùng câu.

### Chuyển mode

1. Đầu câu có 6 alive → vẫn normal.
2. Sau reveal còn 5 alive → câu sau mới survival.
3. Survival mode tự tắt hồi sinh.

### Survival mode

Với 5 người alive, 0 winner:

1. 5 đúng → loại đúng chậm nhất, còn 4.
2. 4 đúng 1 sai → loại người sai, còn 4.
3. 3 đúng 2 sai → 3 đúng thành winner, finished.
4. 2 đúng 3 sai → 2 winner, 3 người còn lại tranh 1 slot.
5. 1 đúng 4 sai → 1 winner, 4 người còn lại tranh 2 slot.
6. 0 đúng → không ai bị loại, hỏi tiếp.

Với 4 người alive, 0 winner:

1. 4 đúng → loại đúng chậm nhất, 3 còn lại winner, finished.
2. 3 đúng 1 sai → 3 đúng winner, finished.
3. 2 đúng 2 sai → 2 winner, 2 người còn lại tranh 1 slot.
4. 1 đúng 3 sai → 1 winner, 3 người còn lại tranh 2 slot.
5. 0 đúng → hỏi tiếp.

Khi đã có winner:

1. Thiếu 1 slot, 2 người đúng → lấy người đúng nhanh nhất.
2. Thiếu 2 slot, 3 người đúng → lấy 2 người đúng nhanh nhất.
3. Thiếu 2 slot, 1 người đúng → chốt 1 winner, tiếp tục tranh 1 slot.
4. Không ai đúng → hỏi tiếp.

---

## 16. Tóm tắt ngắn

Tất cả người chơi bắt đầu là `alive`. Người sống luôn trả lời trên `/play`. Ở normal mode, câu 1 loại tối thiểu 5 người, từ câu 2 loại tối thiểu 2 người. Người sống sai hoặc không trả lời bị loại hết; nếu chưa đủ quota, loại thêm người đúng chậm nhất. Người chết được trả lời để tranh hồi sinh, ai đúng và nhanh nhất được hồi sinh theo cấu hình. Khi sau một câu còn từ 5 người sống trở xuống, câu tiếp theo vào survival mode và tắt hồi sinh. Survival mode có mục tiêu tìm đủ 3 winner. Người đúng được ưu tiên chốt slot thắng, người sai tiếp tục tranh slot còn thiếu theo luật survival. Khi đủ 3 winner thì game kết thúc.
