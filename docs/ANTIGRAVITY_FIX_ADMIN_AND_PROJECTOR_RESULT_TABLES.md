# ANTIGRAVITY_FIX_APPLY_RESULT_AND_PROJECTOR_TABLE.md

# Prompt Fix — Đồng bộ hai bảng Admin và hiển thị bảng kết quả chính thức trên Projector

Hãy đọc code hiện tại sau lần triển khai cơ chế Admin kiểm soát kết quả, đặc biệt:

```txt
lib/game-actions.ts
lib/types.ts
app/admin/page.tsx
app/projector/page.tsx
app/play/page.tsx
components/ui/*
```

Mục tiêu của lần sửa này:

1. Sau khi Admin bấm **XÁC NHẬN KẾT QUẢ VÒNG**, hai bảng Sống / Chết trên `/admin` phải cập nhật ngay theo trạng thái mới.
2. Đồng thời `/projector` phải hiển thị **bảng kết quả chính thức bằng UI bảng hiện có**, không chỉ hiện text hoặc thông báo đơn giản.
3. Không thay đổi logic game mới đã chốt.
4. Không tự survival, không tự winner, không tự finished.

---

## 1. Hành vi bắt buộc khi Admin xác nhận kết quả

Khi Admin bấm:

```txt
XÁC NHẬN KẾT QUẢ VÒNG
```

Action áp dụng kết quả phải:

1. Cập nhật trạng thái player trong Firebase:
   - người sống bị loại: `alive -> dead`
   - người chết được hồi sinh: `dead -> alive`
2. Lưu danh sách kết quả chính thức của vòng:
   - `eliminatedThisRound`
   - `resurrectedThisRound`
   - nếu cần: `survivedThisRound`
3. Xóa dữ liệu pending:
   - `pendingEliminations`
   - `pendingAdditionalEliminations`
   - `pendingResurrections`
4. Set:
   - `resultsApplied = true`
   - `resultsCalculated = true`
   - giữ `phase = "reveal"`
5. Không reset:
   - `answer`
   - `answerTime`
   - kết quả đúng/sai
6. Không tự chuyển câu.
7. Không tự kết thúc game.

---

## 2. Hai bảng `/admin` phải cập nhật ngay

Sau khi apply result thành công:

- Không dùng snapshot cũ `aliveBefore` / `deadBefore` để render.
- Không giữ local state cũ làm nguồn sự thật.
- Phải render trực tiếp từ dữ liệu `players` mới nhất đang được listen từ Firebase.

### Bảng Sống

Hiển thị toàn bộ player hiện có:

```ts
status === "alive"
```

### Bảng Chết

Hiển thị toàn bộ player hiện có:

```ts
status === "dead"
```

Kết quả phải xảy ra ngay:

- Người vừa bị loại biến mất khỏi bảng Sống.
- Người vừa bị loại xuất hiện trong bảng Chết.
- Người vừa hồi sinh biến mất khỏi bảng Chết.
- Người vừa hồi sinh xuất hiện trong bảng Sống.

Không yêu cầu refresh trang thủ công.

Nếu UI dùng local derived state, phải recompute sau mỗi lần Firebase listener nhận dữ liệu mới.

---

## 3. Vẫn giữ xếp hạng kết quả vòng vừa rồi

Sau khi xác nhận, không được mất thông tin câu vừa chơi.

Hai bảng vẫn phải hiển thị được:

- tên;
- đúng / sai / không trả lời;
- thời gian trả lời;
- thứ hạng;
- trạng thái mới;
- nhãn:
  - `ĐÃ BỊ LOẠI`
  - `ĐÃ HỒI SINH`
  - `CÒN SỐNG`
  - `TIẾP TỤC BỊ LOẠI`

Chỉ reset các field này khi Admin bấm **CÂU TIẾP THEO**.

---

## 4. `/projector` phải hiển thị bảng kết quả chính thức

Khi:

```ts
phase === "reveal"
&& resultsApplied === true
```

Projector phải hiển thị bảng kết quả chính thức bằng **UI bảng/card hiện đang có trong project**.

Không thay bằng text thuần kiểu:

```txt
An bị loại
Bình hồi sinh
```

Phải tái sử dụng style/component hiện có như:

```txt
GlassCard
StatusBadge
ResurrectionLeaderboard
bảng xếp hạng hiện tại
```

hoặc component tương đương đang dùng trong codebase.

---

## 5. Cấu trúc bảng trên `/projector`

### Nếu là câu 1

Hiển thị một bảng kết quả toàn bộ người chơi.

Thứ tự:

1. Người trả lời đúng nhanh nhất.
2. Người trả lời đúng chậm dần.
3. Người trả lời sai.
4. Người không trả lời.

Cột gợi ý:

```txt
Hạng
Tên
Kết quả
Thời gian
Trạng thái sau vòng
```

### Từ câu 2 trở đi

Hiển thị hai bảng:

#### BẢNG NGƯỜI SỐNG

Gồm player hiện có `status === "alive"` sau khi đã apply result.

#### BẢNG NGƯỜI CHẾT

Gồm player hiện có `status === "dead"` sau khi đã apply result.

Mỗi bảng nên giữ UI thống nhất với Admin:

```txt
Hạng
Tên
Kết quả
Thời gian
Trạng thái
```

---

## 6. Nhãn trạng thái trên Projector

Dùng tiếng Việt.

### Người vừa bị loại

```txt
ĐÃ BỊ LOẠI
```

### Người vừa hồi sinh

```txt
ĐÃ HỒI SINH
```

### Người vẫn sống

```txt
CÒN SỐNG
```

### Người vẫn chết

```txt
TIẾP TỤC BỊ LOẠI
```

Không hiển thị nhãn tiếng Anh như:

```txt
ALIVE
DEAD
RESURRECTED
ELIMINATED
```

trên giao diện.

---

## 7. Trạng thái trước và sau khi xác nhận

### Trước khi Admin xác nhận

Projector có thể hiển thị:

```txt
KẾT QUẢ DỰ KIẾN — CHỜ ADMIN XÁC NHẬN
```

Nhưng không được chuyển player giữa hai bảng chính thức.

### Sau khi Admin xác nhận

Projector phải chuyển sang:

```txt
KẾT QUẢ CHÍNH THỨC
```

Và hiển thị đúng hai bảng sau trạng thái mới.

---

## 8. Dữ liệu cần lưu để Projector biết ai vừa đổi trạng thái

Nên lưu tối thiểu:

```ts
eliminatedThisRound: string[]
resurrectedThisRound: string[]
resultsApplied: boolean
```

Nếu cần phân biệt key và display name, ưu tiên lưu player key hoặc object rõ ràng:

```ts
eliminatedThisRound: string[] // player keys
resurrectedThisRound: string[] // player keys
```

Không chỉ lưu display name nếu tên có thể trùng.

Projector dùng các danh sách này để gắn badge đúng người.

---

## 9. Không reset answer quá sớm

Sau khi xác nhận:

- giữ nguyên `answer`
- giữ nguyên `answerTime`
- giữ nguyên `lastResult`
- giữ nguyên dữ liệu xếp hạng

Chỉ khi Admin bấm:

```txt
CÂU TIẾP THEO
```

mới:

- reset `answer = null`
- reset `answerTime = null`
- clear:
  - `eliminatedThisRound`
  - `resurrectedThisRound`
  - trạng thái kết quả vòng cũ
- set `resultsApplied = false`
- bắt đầu câu mới khi Admin yêu cầu

---

## 10. Không thay đổi logic gameplay

Giữ nguyên cơ chế hiện tại:

### Câu 1

- Một bảng toàn bộ người chơi.
- Người sai / không trả lời bị loại mặc định.
- Admin có thể loại thêm người đúng chậm nhất.

### Từ câu 2

- Hai bảng Sống / Chết.
- Người sống sai / không trả lời bị loại mặc định.
- Không tự loại thêm 2 người.
- Admin tự chọn người đúng chậm nhất để loại thêm.
- Người chết đúng nhanh nhất được đề xuất hồi sinh tối đa 1 người.
- Chỉ apply sau khi Admin xác nhận.

### Kết thúc

- Không tự kết thúc.
- Chỉ Admin bấm `KẾT THÚC GAME`.

---

## 11. Test cases bắt buộc

### Đồng bộ Admin

1. Có 6 alive, 3 dead.
2. Sau confirm:
   - 2 alive bị loại.
   - 1 dead hồi sinh.
3. Kết quả mong muốn:
   - Bảng Sống còn 5 người.
   - Bảng Chết có 4 người.
   - Người bị loại chuyển sang bảng Chết ngay.
   - Người hồi sinh chuyển sang bảng Sống ngay.
   - Không refresh trang.

### Projector

4. Trước confirm:
   - hiện `KẾT QUẢ DỰ KIẾN`.
5. Sau confirm:
   - hiện `KẾT QUẢ CHÍNH THỨC`.
   - hiện bảng UI đầy đủ.
   - người vừa bị loại có badge `ĐÃ BỊ LOẠI`.
   - người vừa hồi sinh có badge `ĐÃ HỒI SINH`.

### Giữ dữ liệu vòng

6. Sau confirm:
   - answer và answerTime vẫn còn.
   - bảng vẫn xếp đúng theo tốc độ.
7. Sau khi Admin bấm câu tiếp theo:
   - answer và answerTime mới được reset.
   - danh sách kết quả vòng cũ được clear.

---

## 12. Output sau khi hoàn thành

Hãy báo:

1. Các file đã sửa.
2. Vì sao hai bảng trước đây không cập nhật.
3. Cách Firebase listener / derived state được sửa.
4. Component bảng nào được tái sử dụng trên Projector.
5. Xác nhận Projector có trạng thái dự kiến và chính thức.
6. Các test case đã kiểm tra.
