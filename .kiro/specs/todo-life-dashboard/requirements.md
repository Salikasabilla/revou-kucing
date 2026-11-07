# Requirements Document

## Introduction

Todo Life Dashboard adalah aplikasi web single-page yang dibangun menggunakan HTML5, CSS3, dan Vanilla JavaScript murni (tanpa framework, tanpa backend, tanpa database eksternal). Aplikasi ini menggabungkan manajemen tugas harian, timer Pomodoro, tautan cepat yang dapat dikustomisasi, serta tampilan waktu dan salam personal — semua dalam satu antarmuka modern yang responsif. Seluruh teks antarmuka pengguna menggunakan Bahasa Indonesia, sementara kode sumber, nama variabel, fungsi, dan komentar menggunakan Bahasa Inggris. Data disimpan secara lokal menggunakan Browser LocalStorage API tanpa memerlukan koneksi internet atau server.

## Glossary

- **Dashboard**: Halaman utama aplikasi yang menampilkan semua fitur dalam satu tampilan.
- **Task**: Satu item pekerjaan yang dibuat oleh pengguna dalam daftar tugas.
- **TaskList**: Komponen antarmuka dan logika yang mengelola kumpulan Task.
- **PomodoroTimer**: Komponen pencatat waktu fokus berbasis teknik Pomodoro (25 menit).
- **QuickLink**: Tautan URL favorit yang ditambahkan dan dikelola oleh pengguna.
- **QuickLinkManager**: Komponen yang mengelola kumpulan QuickLink.
- **GreetingDisplay**: Komponen yang menampilkan salam personal berdasarkan waktu dan nama pengguna.
- **ClockDisplay**: Komponen yang menampilkan jam dan tanggal secara real-time.
- **ThemeManager**: Komponen yang mengelola preferensi tampilan terang/gelap.
- **LocalStorage**: Browser LocalStorage API yang digunakan untuk menyimpan data secara persisten di sisi klien.
- **CustomName**: Nama pengguna yang diinputkan secara manual dan disimpan di LocalStorage untuk salam personal.
- **DuplicateTask**: Task yang memiliki teks identik dengan Task yang sudah ada setelah normalisasi (case-insensitive dan whitespace).

## Requirements

### Requirement 1: Tampilan Salam Personal dan Waktu Real-Time

**User Story:** Sebagai pengguna, saya ingin melihat salam personal berdasarkan waktu saat ini dan nama saya, serta jam yang selalu diperbarui, agar saya merasa disambut dan mengetahui waktu terkini tanpa perlu keluar dari aplikasi.

#### Acceptance Criteria

1. IF the current local hour is between 05:00 and 11:59 (inclusive), THEN THE GreetingDisplay SHALL display "Selamat Pagi".
2. IF the current local hour is between 12:00 and 14:59 (inclusive), THEN THE GreetingDisplay SHALL display "Selamat Siang".
3. IF the current local hour is between 15:00 and 17:59 (inclusive), THEN THE GreetingDisplay SHALL display "Selamat Sore".
4. IF the current local hour is between 18:00 and 23:59 (inclusive) or between 00:00 and 04:59 (inclusive), THEN THE GreetingDisplay SHALL display "Selamat Malam".
5. IF a CustomName of 1 to 50 characters is stored in LocalStorage, THEN THE GreetingDisplay SHALL display the greeting text followed by ", " and the CustomName followed by "!" (e.g., "Selamat Pagi, Budi!").
6. IF no CustomName is stored in LocalStorage, THEN THE GreetingDisplay SHALL display the greeting text without a personal name.
7. THE ClockDisplay SHALL update the displayed time every 1 second using the browser's local timezone.
8. THE ClockDisplay SHALL display the current date using the full Indonesian day name, numeric date, full Indonesian month name, and four-digit year (e.g., "Senin, 14 Juli 2025").
9. THE ClockDisplay SHALL display the current time in HH:MM:SS 24-hour format.

---

### Requirement 2: Manajemen Daftar Tugas (To-Do List CRUD)

**User Story:** Sebagai pengguna, saya ingin membuat, membaca, memperbarui, dan menghapus tugas, serta menandai tugas sebagai selesai, agar saya dapat melacak dan mengelola pekerjaan harian saya secara efisien.

#### Acceptance Criteria

1. WHEN the page loads, THE TaskList SHALL display all stored tasks retrieved from LocalStorage in the order they were originally added (oldest first).
2. WHEN the user submits a task input containing between 1 and 200 non-whitespace characters, THE TaskList SHALL add a new Task with the provided text, a default completion status of incomplete, and persist it to LocalStorage.
3. WHEN the user marks a Task as complete, THE TaskList SHALL update the Task's completion status to true and apply a strikethrough visual style to the Task text.
4. WHEN the user marks a completed Task as incomplete, THE TaskList SHALL update the Task's completion status to false and remove the strikethrough visual style from the Task text.
5. WHEN the user activates the edit action on a Task, THE TaskList SHALL replace the Task's text display with an editable input field pre-filled with the current Task text.
6. WHEN the user confirms an edit with text containing between 1 and 200 non-whitespace characters, THE TaskList SHALL update the Task text to the new value and persist the change to LocalStorage.
7. IF the user confirms an edit with an empty value or a value containing only whitespace, THEN THE TaskList SHALL reject the edit, preserve the original Task text, and display a validation message in Bahasa Indonesia.
8. WHEN the user cancels an edit action, THE TaskList SHALL discard the edit and restore the Task's original text in the display.
9. WHEN the user activates the delete action on a Task, THE TaskList SHALL remove the Task from the list and from LocalStorage.
10. IF the task input field is empty or contains only whitespace at the time of submission, THEN THE TaskList SHALL prevent task submission and display a validation message in Bahasa Indonesia.
11. THE TaskList SHALL persist all Task data (text, completion status, insertion order) to LocalStorage so that tasks are retained after page reload.

---

### Requirement 3: Pencegahan Duplikasi Tugas

**User Story:** Sebagai pengguna, saya ingin dicegah dari menambahkan tugas yang sama dua kali, agar daftar tugas saya tetap rapi dan tidak redundan.

#### Acceptance Criteria

1. WHEN the user submits a new task, THE TaskList SHALL normalize the input by trimming leading and trailing whitespace, collapsing sequences of internal whitespace to a single space, and converting it to lowercase before comparison.
2. WHEN the normalized input matches the normalized text of any existing Task, THE TaskList SHALL reject the submission, preserve the user's original input in the input field, and display a notification in Bahasa Indonesia indicating that the task already exists; the notification SHALL remain visible until the user modifies the input or performs another submission.
3. WHEN the normalized input does not match any existing Task, THE TaskList SHALL proceed with adding the new Task.
4. WHEN the user confirms an edited task text, THE TaskList SHALL apply the same duplicate-check normalization (trim, collapse internal whitespace, lowercase) against all other existing tasks (excluding the task being edited).
5. IF the edited task text, after normalization, matches an existing Task's normalized text, THEN THE TaskList SHALL reject the edit, preserve the in-progress input in the edit field, and display a notification in Bahasa Indonesia; the notification SHALL remain visible until the user modifies the input or cancels the edit.

---

### Requirement 4: Timer Pomodoro

**User Story:** Sebagai pengguna, saya ingin menggunakan timer Pomodoro 25 menit dengan kontrol mulai, jeda, dan atur ulang, agar saya dapat menjaga fokus kerja menggunakan teknik manajemen waktu yang terstruktur.

#### Acceptance Criteria

1. THE PomodoroTimer SHALL initialize with a countdown duration of 25 minutes (1500 seconds).
2. THE PomodoroTimer SHALL display the remaining time in MM:SS format.
3. WHEN the user activates the Start control while the timer is in a paused or reset state, THE PomodoroTimer SHALL begin or resume counting down one second per real second.
4. WHEN the user activates the Pause control while the timer is running, THE PomodoroTimer SHALL stop the countdown and retain the remaining time.
5. WHEN the user activates the Start control after a pause, THE PomodoroTimer SHALL resume counting down from the retained remaining time.
6. WHEN the user activates the Reset control, THE PomodoroTimer SHALL stop any active countdown and reset the remaining time to 25:00.
7. WHEN the countdown reaches 00:00, THE PomodoroTimer SHALL stop automatically and display an inline notification in Bahasa Indonesia indicating the session is complete (e.g., "Sesi Pomodoro selesai!") for a minimum of 5 seconds.
8. WHILE the timer is running, THE PomodoroTimer SHALL display the Pause control, hide the Start control, and keep the Reset control visible.
9. WHILE the timer is paused, reset, or completed (remaining time is 00:00), THE PomodoroTimer SHALL display the Start control, hide the Pause control, and keep the Reset control visible.
10. IF the user activates the Start control while the timer is already running, THEN THE PomodoroTimer SHALL ignore the activation and continue counting down without interruption.

---

### Requirement 5: Manajemen Tautan Cepat (Quick Links)

**User Story:** Sebagai pengguna, saya ingin menambahkan, mengakses, dan menghapus tautan website favorit saya, agar saya dapat dengan cepat membuka situs yang sering saya kunjungi langsung dari dashboard.

#### Acceptance Criteria

1. THE QuickLinkManager SHALL display all stored QuickLinks retrieved from LocalStorage on page load.
2. WHEN the user submits a label (1–50 characters) and a non-empty URL, THE QuickLinkManager SHALL add a new QuickLink and persist it to LocalStorage.
3. WHEN the user activates a QuickLink, THE QuickLinkManager SHALL open the associated URL in a new browser tab.
4. WHEN the user activates the delete action on a QuickLink, THE QuickLinkManager SHALL remove the QuickLink from the list and from LocalStorage.
5. IF the submitted URL does not begin with "http://" or "https://", THEN THE QuickLinkManager SHALL automatically prepend "https://" to the URL before saving.
6. IF the label field is empty, the label exceeds 50 characters, or the URL field is empty, THEN THE QuickLinkManager SHALL prevent submission and display a validation message in Bahasa Indonesia adjacent to the corresponding invalid field.
7. THE QuickLinkManager SHALL persist all QuickLink data (label, URL) to LocalStorage so that links are retained after page reload.
8. IF the number of stored QuickLinks has reached 20, THEN THE QuickLinkManager SHALL prevent adding a new QuickLink and display an error message in Bahasa Indonesia indicating the maximum limit has been reached.

---

### Requirement 6: Nama Kustom untuk Salam Personal

**User Story:** Sebagai pengguna, saya ingin mengatur nama saya sendiri agar salam di dashboard menjadi lebih personal dan relevan untuk saya.

#### Acceptance Criteria

1. THE Dashboard SHALL provide an input field where the user can enter a CustomName of up to 50 characters.
2. WHEN the user submits a CustomName that is non-empty and non-whitespace-only, THE Dashboard SHALL save the CustomName (trimmed of leading and trailing whitespace) to LocalStorage and update the GreetingDisplay within 1 second.
3. WHEN the user submits a CustomName that is empty or contains only whitespace characters, THE Dashboard SHALL remove any stored CustomName from LocalStorage and revert the GreetingDisplay to display the greeting without a name within 1 second.
4. WHEN the Dashboard page loads, THE Dashboard SHALL read the CustomName from LocalStorage and, if a CustomName is present, display the personalized greeting within 1 second of page load completion.

---

### Requirement 7: Mode Terang/Gelap (Light/Dark Mode)

**User Story:** Sebagai pengguna, saya ingin dapat beralih antara tampilan terang dan gelap, dan preferensi saya tersimpan, agar saya dapat menyesuaikan tampilan dashboard dengan kenyamanan visual saya tanpa perlu mengatur ulang setiap kali membuka aplikasi.

#### Acceptance Criteria

1. THE ThemeManager SHALL provide a toggle control with a visible icon to switch between light mode and dark mode, where the toggle control visually reflects the currently active theme at all times.
2. WHEN the user activates the theme toggle, THE ThemeManager SHALL switch the active theme between light and dark and persist the selected theme to LocalStorage.
3. WHEN the page loads, THE ThemeManager SHALL read the stored theme preference from LocalStorage and apply it before any UI components are rendered.
4. WHEN no theme preference is stored in LocalStorage, THE ThemeManager SHALL check the OS-level color scheme preference, applying dark mode if the OS preference is dark, and light mode otherwise.
5. IF LocalStorage is unavailable or inaccessible, THEN THE ThemeManager SHALL apply the light theme as the default and the toggle control SHALL remain functional for the duration of the session without persisting the preference.
6. THE Dashboard SHALL apply a defined color scheme for each mode — light mode using a light background with dark foreground text, and dark mode using a dark background with light foreground text — consistently across all visible components including navigation, cards, tables, and form elements.

---

### Requirement 8: Persistensi Data dengan LocalStorage

**User Story:** Sebagai pengguna, saya ingin semua data saya tersimpan secara otomatis di browser, agar saya tidak kehilangan tugas, tautan, nama, atau preferensi tampilan setelah menutup atau menyegarkan halaman.

#### Acceptance Criteria

1. THE Dashboard SHALL store Task data (text of up to 500 characters, and completion status as a boolean) under a dedicated LocalStorage key on every create, update, or delete operation, supporting a maximum of 100 tasks.
2. THE Dashboard SHALL store QuickLink data (label of up to 100 characters, URL of up to 2048 characters) under a dedicated LocalStorage key on every add or delete operation, supporting a maximum of 50 QuickLinks.
3. THE Dashboard SHALL store the CustomName (up to 100 characters) under a dedicated LocalStorage key whenever it is set or cleared.
4. THE Dashboard SHALL store the theme preference under a dedicated LocalStorage key whenever the theme is changed.
5. WHEN the page loads, THE Dashboard SHALL read all persisted data from LocalStorage and restore the full application state — including Tasks, QuickLinks, CustomName, and theme preference — before rendering any UI element.
6. IF LocalStorage is unavailable or throws an error during any read or write operation, THEN THE Dashboard SHALL display a non-blocking notification in Bahasa Indonesia informing the user that data persistence is not available, and SHALL continue to function in a session-only mode without retrying LocalStorage access for the remainder of the session.

---

### Requirement 9: Antarmuka Responsif dan Desain Visual

**User Story:** Sebagai pengguna, saya ingin antarmuka yang modern, minimalis, dan responsif agar saya dapat menggunakan dashboard dengan nyaman di perangkat desktop, tablet, maupun ponsel.

#### Acceptance Criteria

1. THE Dashboard SHALL adapt its layout to viewport widths of at least 320px (mobile), 768px (tablet), and 1024px (desktop) without horizontal scrolling.
2. THE Dashboard SHALL apply consistent typography with body text at a minimum of 16px, H1 headings at a minimum of 24px, H2 headings at a minimum of 20px, and H3 headings at a minimum of 16px with a visually distinct style from body text.
3. THE Dashboard SHALL apply smooth CSS transitions with a duration between 150ms and 400ms for theme switching, task completion, and hover states on buttons, links, navigation items, and task list items.
4. THE Dashboard SHALL use a color palette where normal text (below 18px or 14px bold) meets a minimum contrast ratio of 4.5:1 against its background, and large text (at or above 18px or 14px bold) meets a minimum contrast ratio of 3:1, in both light and dark themes.
5. THE Dashboard SHALL use only HTML5, CSS3, and Vanilla JavaScript with no external JavaScript frameworks, CSS frameworks, or backend dependencies, and SHALL be fully functional without a server runtime.

---

### Requirement 10: Struktur Proyek dan Kesiapan Deployment

**User Story:** Sebagai pengembang, saya ingin struktur file proyek yang terorganisir agar aplikasi dapat di-deploy ke GitHub Pages dengan mudah.

#### Acceptance Criteria

1. THE Dashboard SHALL be served from a single `index.html` file located at the project root.
2. THE Dashboard SHALL load its styles from a single CSS file located at `css/style.css`, referenced in `index.html` using a relative path.
3. THE Dashboard SHALL load its logic from a single JavaScript file located at `js/app.js`, referenced in `index.html` using a relative path.
4. WHILE served as a static site from GitHub Pages, THE Dashboard SHALL render all visual components and respond to all user interactions without requiring any server-side requests.
5. THE Dashboard SHALL preserve the existing `.kiro/` directory structure in the repository without modification.
6. THE Dashboard SHALL use only relative paths for all asset references (CSS, JavaScript, images, and fonts) within `index.html` and `js/app.js`.
