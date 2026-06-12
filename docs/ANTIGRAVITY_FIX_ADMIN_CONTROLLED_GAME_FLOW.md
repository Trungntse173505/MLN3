# ANTIGRAVITY_FIX_ADMIN_CONTROLLED_GAME_FLOW.md

# Prompt Fix — Chuyển toàn bộ nhịp game sang Admin kiểm soát

Hãy đọc codebase hiện tại sau các lần triển khai Game Logic V2 trước đó, đặc biệt:

```txt
lib/game-actions.ts
lib/types.ts
app/admin/page.tsx
app/play/page.tsx
app/projector/page.tsx
```

Mục tiêu của lần sửa này là **loại bỏ toàn bộ cơ chế tự động quyết định nhịp game** như survival tự kích hoạt, collapse, tự chốt winner, tự kết thúc, tự loại theo quota.

Từ bản sửa này:

> Hệ thống chỉ chấm đáp án, tính thời gian, xếp hạng và đề xuất trạng thái.  
> Admin là người quyết định loại thêm ai, áp dụng kết quả khi nào, chuyển câu khi nào và kết thúc game khi nào.

Không viết lại toàn bộ dự án. Chỉ sửa các phần liên quan và giữ nguyên UI/style hiện có nếu không cần thay đổi.

---

## 1. Nguyên tắc cốt lõi mới

### Hệ thống tự động làm

- Chấm đúng / sai / không trả lời.
- Tính thời gian phản hồi.
- Xếp hạng người trả lời đúng từ nhanh nhất đến chậm nhất.
- Đưa người sai và không trả lời xuống cuối bảng.
- Đánh dấu người sống sai hoặc không trả lời là **mặc định bị loại**.
- Từ câu 2 trở đi, đề xuất hồi sinh tối đa 1 người chết trả lời đúng nhanh nhất.
- Hiển thị đầy đủ hai bảng sống / chết cho Admin.

### Admin quyết định

- Có loại thêm người trả lời đúng chậm nhất hay không.
- Loại thêm bao nhiêu người.
- Khi nào xác nhận áp dụng kết quả.
- Khi nào chuyển câu.
- Khi nào kết thúc game.
- Người thắng cuối cùng được công bố khi Admin chủ động kết thúc game.

---

## 2. Loại bỏ toàn bộ logic tự động cũ

Phải vô hiệu hóa hoặc xóa bỏ các nhánh logic sau:

- Tự loại 5 người ở câu 1.
- Tự loại 2 người từ câu 2.
- Tự chuyển `mode = "survival"` khi `aliveCount <= 5`.
- Tự collapse khi `aliveCorrect.length <= 3`.
- Tự tạo `survivalContestants`.
- Tự bật `onlyOneWinnerPerQuestion`.
- Tự chốt `winner`.
- Tự tranh slot.
- Tự chuyển `phase = "finished"` khi còn 3 người hoặc đủ 3 winner.
- Tự khóa Top 3.
- Tự quyết định kết thúc game theo số người sống.

Nếu các field cũ còn tồn tại để tương thích dữ liệu, có thể giữ type/fallback nhưng không được dùng để điều khiển gameplay mới.

Ví dụ các field legacy:

```ts
mode
winnerSlotsRemaining
survivalContestants
onlyOneWinnerPerQuestion
winnersThisRound
top3Locked
```

Có thể giữ để backward compatibility, nhưng gameplay mới không phụ thuộc vào chúng.

---

## 3. Câu 1 — Một bảng toàn bộ người chơi

Ở câu đầu tiên:

- Tất cả player bắt đầu với `status = "alive"`.
- Admin chỉ thấy một bảng toàn bộ người chơi.

Sau khi reveal câu 1, sắp xếp bảng như sau:

1. Người trả lời đúng nhanh nhất.
2. Những người trả lời đúng còn lại, từ nhanh đến chậm.
3. Người trả lời sai.
4. Người không trả lời.

Yêu cầu:

- Nhóm sai và không trả lời chỉ cần nằm sau nhóm đúng.
- Không cần xếp tốc độ chi tiết giữa người sai và người không trả lời.
- Người sai hoặc không trả lời được đánh dấu **mặc định bị loại**.
- Không còn quota bắt buộc loại 5 người.
- Admin có thể chọn thêm người đúng chậm nhất để loại.
- Trạng thái chỉ được cập nhật sau khi Admin xác nhận áp dụng kết quả.

---

## 4. Từ câu 2 trở đi — Hai bảng Sống và Chết

Từ câu thứ 2:

### Bảng người sống

Chỉ chứa player có:

```ts
status === "alive"
```

Sắp xếp:

1. Đúng nhanh nhất.
2. Đúng chậm dần.
3. Sai.
4. Không trả lời.

Xử lý mặc định:

- Người sống trả lời sai hoặc không trả lời được đánh dấu sẽ bị loại.
- Không tự loại thêm 2 người.
- Không còn bất kỳ quota loại thêm nào.
- Admin có thể chọn thêm 0, 1, 2 hoặc nhiều người đúng chậm nhất để loại.
- Admin nhìn bảng xếp hạng để quyết định.

### Bảng người chết

Chỉ chứa player có:

```ts
status === "dead"
```

Sắp xếp:

1. Đúng nhanh nhất.
2. Đúng chậm dần.
3. Sai.
4. Không trả lời.

Xử lý mặc định:

- Mặc định đề xuất hồi sinh tối đa 1 người.
- Chỉ người trả lời đúng mới đủ điều kiện.
- Người đúng nhanh nhất được đề xuất hồi sinh.
- Nếu không có ai đúng thì không ai hồi sinh.
- Người sai hoặc không trả lời tiếp tục giữ `dead`.
- Người đúng nhưng không phải nhanh nhất vẫn `dead`.

Trạng thái chỉ đổi sau khi Admin xác nhận.

---

## 5. Luồng Reveal mới

Không được để `revealAnswer()` vừa chấm vừa cập nhật trạng thái player ngay lập tức.

Tách thành hai bước rõ ràng.

### Bước 1 — Tính và hiển thị kết quả dự kiến

Khi Admin bấm công bố đáp án:

- Chấm đáp án.
- Tính thời gian.
- Xếp hạng bảng.
- Tạo:
  - danh sách người sống mặc định bị loại vì sai / không trả lời;
  - danh sách người đúng chậm nhất có thể được Admin chọn loại thêm;
  - danh sách người chết đúng nhanh nhất được đề xuất hồi sinh.

Không đổi `status` thật ở bước này.

### Bước 2 — Admin xác nhận áp dụng

Admin bấm:

```txt
XÁC NHẬN KẾT QUẢ VÒNG
```

Lúc này mới apply:

- Người sống sai / không trả lời: `alive -> dead`
- Người đúng chậm được Admin chọn thêm: `alive -> dead`
- Người chết đúng nhanh nhất được duyệt hồi sinh: `dead -> alive`

Sau đó:

- clear pending state;
- giữ `phase = "reveal"` hoặc chuyển trạng thái phù hợp để Admin chủ động bấm câu tiếp theo;
- tuyệt đối không tự bắt đầu câu mới;
- tuyệt đối không tự kết thúc game.

---

## 6. Cơ chế Admin chọn người đúng chậm để loại thêm

Cần có cơ chế chọn số lượng hoặc chọn trực tiếp.

Khuyến nghị UI:

```txt
Loại thêm người đúng chậm nhất: [0]
```

Admin có thể tăng:

```txt
0, 1, 2, 3, ...
```

Hệ thống chọn từ cuối danh sách người đúng.

Ví dụ:

```txt
5 người đúng
Admin chọn loại thêm 2
```

Kết quả:

```txt
2 người đúng chậm nhất được thêm vào pendingEliminations
```

Giới hạn tối đa:

```ts
additionalEliminationCount <= correctAlivePlayers.length
```

Không được tự loại thêm nếu Admin chọn 0.

---

## 7. Hồi sinh mặc định 1 người

Từ câu 2 trở đi:

```ts
defaultResurrectionCount = 1
```

Nhưng lưu ý:

- Đây là tối đa 1 người.
- Chỉ người chết trả lời đúng mới đủ điều kiện.
- Nếu 0 người đúng thì 0 người hồi sinh.
- Nếu có nhiều người đúng thì lấy người nhanh nhất.
- Admin vẫn phải xác nhận kết quả trước khi apply.

Không cần thanh chỉnh số hồi sinh nếu yêu cầu hiện tại là cố định 1 người.

Nếu code cũ đã có thanh `resurrectionCount`, có thể:

- khóa giá trị mặc định là 1;
- hoặc giữ UI nhưng mặc định 1.

Tuy nhiên gameplay mới phải đảm bảo không tự hồi sinh trước khi Admin xác nhận.

---

## 8. Dữ liệu pending đề xuất

Nên bổ sung vào `GameState` hoặc state phù hợp:

```ts
pendingEliminations: string[]
pendingAdditionalEliminations: string[]
pendingResurrections: string[]
resultsCalculated: boolean
resultsApplied: boolean
```

Nếu cần lưu chi tiết:

```ts
pendingResultReasons: Record<
  string,
  "wrong" | "no_answer" | "slow_correct" | "fastest_dead_correct"
>
```

Có thể đặt tên khác theo convention codebase hiện tại.

---

## 9. Cập nhật `/admin`

### Trước câu 1

Hiển thị một bảng toàn bộ player.

### Sau câu 1

Bảng hiển thị:

- tên;
- đúng / sai / không trả lời;
- thời gian;
- thứ hạng;
- trạng thái dự kiến;
- checkbox hoặc điều khiển loại thêm người đúng chậm.

### Từ câu 2

Hiển thị hai bảng cạnh nhau hoặc hai khu vực rõ ràng:

#### Bảng Sống

- Tên.
- Kết quả.
- Thời gian.
- Thứ hạng.
- Mặc định bị loại hay không.
- Có bị Admin chọn loại thêm hay không.

#### Bảng Chết

- Tên.
- Kết quả.
- Thời gian.
- Thứ hạng.
- Có được đề xuất hồi sinh hay không.

### Nút Admin

Cần có:

```txt
CÔNG BỐ ĐÁP ÁN
XÁC NHẬN KẾT QUẢ VÒNG
CÂU TIẾP THEO
KẾT THÚC GAME
```

Quy tắc:

- `CÔNG BỐ ĐÁP ÁN`: chỉ tính kết quả và hiển thị pending.
- `XÁC NHẬN KẾT QUẢ VÒNG`: mới apply status.
- `CÂU TIẾP THEO`: Admin chủ động bấm.
- `KẾT THÚC GAME`: Admin chủ động bấm.

---

## 10. Cập nhật `/play`

Người chơi chỉ thấy trạng thái chính thức sau khi Admin xác nhận.

Không được hiển thị:

- đã chết;
- đã hồi sinh;

chỉ dựa trên pending result.

Trong lúc chờ Admin xác nhận, hiển thị:

```txt
Đã ghi nhận kết quả.
Đang chờ Admin xác nhận vòng chơi.
```

Sau khi apply:

- `alive`: hiển thị còn sống.
- `dead`: hiển thị bị loại.
- người vừa hồi sinh: hiển thị đã hồi sinh.

---

## 11. Cập nhật `/projector`

Khi reveal:

- Hiển thị đáp án đúng.
- Hiển thị bảng xếp hạng.
- Có thể hiển thị trạng thái “dự kiến” nếu muốn, nhưng phải ghi rõ:

```txt
KẾT QUẢ DỰ KIẾN — CHỜ ADMIN XÁC NHẬN
```

Sau khi Admin xác nhận:

- Hiển thị danh sách bị loại chính thức.
- Hiển thị người được hồi sinh chính thức.
- Không tự chuyển sang màn kết thúc.

---

## 12. Kết thúc game hoàn toàn thủ công

Thêm hoặc giữ action:

```ts
finishGame()
```

Chỉ `/admin` được gọi action này.

Khi Admin bấm `KẾT THÚC GAME`:

```ts
phase = "finished"
```

Không được có bất kỳ đoạn code nào tự set `finished` dựa trên:

- số người sống;
- số người chết;
- số winner;
- số câu đã chơi;
- số người đúng;
- điều kiện top 3.

Nếu hết kho câu hỏi:

- hiển thị cảnh báo cho Admin;
- không tự kết thúc game nếu chưa được Admin xác nhận.

---

## 13. Giữ nguyên chọn độ khó

Không thay đổi cơ chế Admin chọn:

```txt
Dễ
Trung bình
Khó
```

Không hard-code độ khó theo vòng.

Không tự đổi độ khó khi còn ít người.

---

## 14. Những logic cần xóa hoặc vô hiệu hóa trong `game-actions.ts`

Tìm và loại bỏ ảnh hưởng gameplay của các đoạn kiểu:

```ts
if (aliveCount <= 5) {
  mode = "survival"
}
```

```ts
if (aliveCorrect.length <= 3) {
  // collapse
}
```

```ts
if (winnerCount >= 3) {
  phase = "finished"
}
```

```ts
eliminationQuota = currentQuestion === 1 ? 5 : 2
```

```ts
onlyOneWinnerPerQuestion = true
```

Không để các field này tiếp tục tác động đến trạng thái game.

---

## 15. Test cases bắt buộc

### Câu 1

1. 10 người, 7 đúng, 3 sai:
   - 3 sai pending bị loại.
   - Admin chọn loại thêm 0.
   - Sau confirm: 7 alive, 3 dead.

2. 10 người, 10 đúng:
   - Không ai pending bị loại mặc định.
   - Admin chọn loại thêm 2.
   - Hai người đúng chậm nhất bị loại sau confirm.

3. 10 người, 8 đúng, 2 không trả lời:
   - 2 người không trả lời pending bị loại.
   - Admin có thể chọn thêm người đúng chậm.

### Từ câu 2

4. Bảng sống: 6 người, 4 đúng, 2 sai:
   - 2 sai pending bị loại.
   - Không tự loại thêm.
   - Admin chọn loại thêm 1:
     - người đúng chậm nhất thêm vào pending.

5. Bảng chết: 5 người, 3 đúng:
   - người đúng nhanh nhất pending hồi sinh.
   - 2 người đúng chậm hơn vẫn dead.

6. Bảng chết: tất cả sai:
   - pendingResurrections = [].

7. Admin chưa confirm:
   - status player chưa đổi.

8. Admin confirm:
   - apply đúng pending.

### Kết thúc

9. Chỉ còn 3 alive:
   - game không tự finished.

10. Chỉ còn 1 alive:
   - game không tự finished.

11. Admin bấm kết thúc:
   - phase = finished.

---

## 16. Output sau khi hoàn thành

Hãy báo:

1. Các file đã sửa.
2. Các logic auto đã vô hiệu hóa.
3. Cách pending result hoạt động.
4. Cách Admin chọn loại thêm người đúng chậm.
5. Cách hồi sinh mặc định 1 người hoạt động.
6. Xác nhận game không còn tự survival / collapse / finished.
7. Các test case đã kiểm tra.
