import customtkinter as ctk
from tkcalendar import DateEntry
from tkinter import messagebox, filedialog
from PIL import Image, ImageDraw, ImageFont
import json
import os
import datetime

TASKS_FILE = "tasks.json"
ALL_DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
URGENCE_LEVELS = [
    ("🟢", "Faible"),
    ("🟡", "Moyen"),
    ("🟠", "Élevé"),
    ("🔥", "Critique")
]
URGENCE_COLORS = {
    "🟢": "#b6fcb6",
    "🟡": "#fff7b2",
    "🟠": "#ffd59e",
    "🔥": "#ffb2b2"
}

def load_tasks():
    if not os.path.exists(TASKS_FILE):
        return []
    with open(TASKS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_tasks(tasks):
    with open(TASKS_FILE, "w", encoding="utf-8") as f:
        json.dump(tasks, f, ensure_ascii=False, indent=2)

def emoji_img(emoji, size=28):
    try:
        font = ImageFont.truetype("seguiemj.ttf", size=int(size*0.8))
    except OSError:
        font = ImageFont.load_default()
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.text((size//2, size//2), emoji, embedded_color=True, font=font, anchor="mm")
    return ctk.CTkImage(img, size=(size, size))

class TaskManagerApp(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title("Gestionnaire de tâches hebdomadaire")
        self.geometry("1100x630")
        self.resizable(True, True)
        self.tasks = load_tasks()
        self.show_weekend = ctk.BooleanVar(value=False)
        self.emoji_icons = {emoji: emoji_img(emoji, size=28) for emoji, _ in URGENCE_LEVELS}
        self.urgence_var = ctk.StringVar(value=URGENCE_LEVELS[0][0])
        self.week_start = self.get_start_of_week(datetime.date.today())
        self.dragged_task = None
        self.frames = []
        self.create_widgets()
        self.update_weekend_view()  # Attention : NE PAS appeler self.refresh_tasks() séparément

    def get_display_days(self):
        return ALL_DAYS if self.show_weekend.get() else ALL_DAYS[:5]

    def get_week_dates(self):
        return [self.week_start + datetime.timedelta(days=i)
                for i in range(len(self.get_display_days()))]

    def get_start_of_week(self, any_date):
        return any_date - datetime.timedelta(days=(any_date.weekday()))

    def create_widgets(self):
        # Première ligne : ajout/export/import
        self.menu_frame = ctk.CTkFrame(self)
        self.menu_frame.pack(fill="x", padx=10, pady=(5,0))
        self.title_entry = ctk.CTkEntry(self.menu_frame, placeholder_text="Titre de la tâche", width=180)
        self.title_entry.pack(side="left", padx=5)
        self.desc_entry = ctk.CTkEntry(self.menu_frame, placeholder_text="Description", width=220)
        self.desc_entry.pack(side="left", padx=5)
        date_frame = ctk.CTkFrame(self.menu_frame, fg_color="transparent")
        date_frame.pack(side="left", padx=5)
        self.date_entry = DateEntry(date_frame, date_pattern="yyyy-mm-dd", locale='fr_FR')
        self.date_entry.pack()
        self.urgence_buttons = []
        for emoji, label in URGENCE_LEVELS:
            icon = self.emoji_icons[emoji]
            btn = ctk.CTkButton(
                self.menu_frame, text="", image=icon, width=36,
                fg_color="#e0e0e0",
                command=lambda e=emoji: self.select_urgence(e)
            )
            btn.pack(side="left", padx=2)
            self.urgence_buttons.append((btn, emoji))
        self.update_urgence_buttons()
        ctk.CTkButton(self.menu_frame, text="Ajouter", command=self.add_task).pack(side="left", padx=8)
        ctk.CTkButton(self.menu_frame, text="📤 Export", command=self.export_tasks).pack(side="right", padx=3)
        ctk.CTkButton(self.menu_frame, text="📥 Import", command=self.import_tasks).pack(side="right", padx=3)

        # Deuxième ligne : commandes semaine/week-end toujours accessibles
        self.command_frame = ctk.CTkFrame(self)
        self.command_frame.pack(fill="x", padx=10, pady=(2,5))
        ctk.CTkButton(self.command_frame, text="⟨ Semaine préc.", width=120, command=self.goto_prev_week).pack(side="left", padx=4)
        ctk.CTkButton(self.command_frame, text="Semaine suiv. ⟩", width=120, command=self.goto_next_week).pack(side="left", padx=4)
        ctk.CTkCheckBox(self.command_frame, text="Afficher le week-end", variable=self.show_weekend,
                        command=self.update_weekend_view).pack(side="left", padx=20)

        # Grille principale (jours+tâches)
        self.grid_frame = ctk.CTkFrame(self)
        self.grid_frame.pack(fill="both", expand=True, padx=10, pady=5)

    def update_weekend_view(self):
        for frame in self.frames:
            frame.destroy()
        self.frames.clear()
        self.update_day_frames()
        self.refresh_tasks()

    def update_day_frames(self):
        days = self.get_display_days()
        num_days = len(days)
        for i in range(num_days):
            self.grid_frame.grid_columnconfigure(i, weight=1)
        week_dates = self.get_week_dates()
        for i, day in enumerate(days):
            frame = ctk.CTkFrame(self.grid_frame)
            frame.grid(row=0, column=i, padx=3, pady=3, sticky="nsew")
            date_str = week_dates[i].strftime("%Y-%m-%d")
            label = ctk.CTkLabel(frame, text=f"{day}\n{date_str}", font=("Arial", 14, "bold"))
            label.pack(pady=5)
            frame.day_date = week_dates[i]
            frame.day_idx = i
            frame.bind("<Enter>", self.on_enter_day)
            self.frames.append(frame)

    def select_urgence(self, emoji):
        self.urgence_var.set(emoji)
        self.update_urgence_buttons()

    def update_urgence_buttons(self):
        selected = self.urgence_var.get()
        for btn, emoji in self.urgence_buttons:
            if emoji == selected:
                btn.configure(fg_color="#cccccc", border_width=2, border_color="#333333")
            else:
                btn.configure(fg_color="#e0e0e0", border_width=0)

    def add_task(self):
        titre = self.title_entry.get().strip()
        desc = self.desc_entry.get().strip()
        date = self.date_entry.get_date().strftime('%Y-%m-%d')
        urgence = self.urgence_var.get()
        if not (titre and date and urgence):
            messagebox.showwarning("Champs manquants", "Veuillez remplir tous les champs obligatoires.")
            return
        task = {
            "titre": titre,
            "description": desc,
            "date": date,
            "urgence": urgence,
            "statut": "à faire"
        }
        self.tasks.append(task)
        save_tasks(self.tasks)
        self.title_entry.delete(0, "end")
        self.desc_entry.delete(0, "end")
        self.urgence_var.set(URGENCE_LEVELS[0][0])
        self.update_urgence_buttons()
        self.refresh_tasks()

    def refresh_tasks(self):
        for frame in self.frames:
            widgets = list(frame.winfo_children())
            for widget in widgets[1:]:
                widget.destroy()
        week_dates = self.get_week_dates()
        for i, day_date in enumerate(week_dates):
            day_str = day_date.strftime("%Y-%m-%d")
            day_tasks = [t for t in self.tasks if t["date"] == day_str]
            for task in day_tasks:
                self.display_task(self.frames[i], task)

    def display_task(self, frame, task):
        urgence = task["urgence"]
        bg_color = URGENCE_COLORS.get(urgence, "#f0f0f0")
        task_frame = ctk.CTkFrame(frame, fg_color=bg_color)
        task_frame.pack(fill="x", pady=2, padx=2)
        icon = self.emoji_icons.get(urgence)
        ctk.CTkLabel(task_frame, text="", image=icon, width=30).pack(side="left")
        ctk.CTkLabel(task_frame, text=task["titre"], font=("Arial", 12, "bold")).pack(side="left", padx=2)
        ctk.CTkLabel(task_frame, text=f"[{task['statut']}]", font=("Arial", 10)).pack(side="left", padx=2)
        ctk.CTkButton(task_frame, text="✏️", width=24, command=lambda t=task: self.edit_task(t)).pack(side="right", padx=1)
        ctk.CTkButton(task_frame, text="🗑️", width=24, command=lambda t=task: self.delete_task(t)).pack(side="right", padx=1)
        # Drag and drop
        task_frame.bind("<ButtonPress-1>", lambda event, tf=task_frame, t=task: self.start_drag(event, tf, t, frame.day_idx))
        task_frame.bind("<B1-Motion>", self.do_drag)
        task_frame.bind("<ButtonRelease-1>", lambda event, t=task: self.end_drag(event, t))

    def start_drag(self, event, widget, task, orig_col_idx):
        self.dragged_task = {"task": task, "widget": widget, "orig_col_idx": orig_col_idx}
        widget.start_y = event.y_root

    def do_drag(self, event):
        pass  # Ajouter feedback visuel au besoin

    def end_drag(self, event, task):
        if not self.dragged_task:
            return
        x_win = self.grid_frame.winfo_rootx()
        col_w = self.grid_frame.winfo_width() // len(self.frames)
        x_rel = event.x_root - x_win
        col_idx = int(x_rel // col_w)
        if 0 <= col_idx < len(self.frames):
            new_date = self.frames[col_idx].day_date.strftime('%Y-%m-%d')
            if task["date"] != new_date:
                task["date"] = new_date
                save_tasks(self.tasks)
                self.refresh_tasks()
        self.dragged_task = None

    def on_enter_day(self, event):
        pass  # Optionnel pour survol

    def edit_task(self, task):
        edit_win = ctk.CTkToplevel(self)
        edit_win.title("Modifier la tâche")
        edit_win.geometry("400x330")
        edit_win.transient(self)
        edit_win.grab_set()
        edit_win.focus_force()
        form_frame = ctk.CTkFrame(edit_win)
        form_frame.pack(fill="both", expand=True, padx=20, pady=20)
        titre_entry = ctk.CTkEntry(form_frame, placeholder_text="Titre", width=300)
        titre_entry.insert(0, task["titre"])
        titre_entry.pack(pady=8)
        desc_entry = ctk.CTkEntry(form_frame, placeholder_text="Description", width=300)
        desc_entry.insert(0, task["description"])
        desc_entry.pack(pady=8)
        date_frame = ctk.CTkFrame(form_frame, fg_color="transparent")
        date_frame.pack(pady=8)
        date_entry = DateEntry(date_frame, date_pattern="yyyy-mm-dd", locale='fr_FR')
        try:
            date_entry.set_date(datetime.datetime.strptime(task["date"], "%Y-%m-%d"))
        except Exception:
            pass
        date_entry.pack()
        urgence_var = ctk.StringVar(value=task["urgence"])
        emoji_icons = {emoji: emoji_img(emoji, size=28) for emoji, _ in URGENCE_LEVELS}
        urgence_frame = ctk.CTkFrame(form_frame, fg_color="transparent")
        urgence_frame.pack(pady=8)
        urgence_buttons = []
        def select_edit_urgence(e):
            urgence_var.set(e)
            update_edit_urgence_buttons()
        def update_edit_urgence_buttons():
            selected = urgence_var.get()
            for btn, emoji in urgence_buttons:
                if emoji == selected:
                    btn.configure(fg_color="#cccccc", border_width=2, border_color="#333333")
                else:
                    btn.configure(fg_color="#e0e0e0", border_width=0)
        for emoji, label in URGENCE_LEVELS:
            icon = emoji_icons[emoji]
            btn = ctk.CTkButton(
                urgence_frame, text="", image=icon, width=36,
                fg_color="#e0e0e0",
                command=lambda e=emoji: select_edit_urgence(e)
            )
            btn.pack(side="left", padx=2)
            urgence_buttons.append((btn, emoji))
        update_edit_urgence_buttons()
        statut_var = ctk.StringVar(value=task["statut"])
        ctk.CTkOptionMenu(form_frame, variable=statut_var, values=["à faire", "fait"]).pack(pady=8)
        ctk.CTkButton(form_frame, text="Enregistrer", command=lambda: self.save_edit(
            task, titre_entry, desc_entry, date_entry, urgence_var, statut_var, edit_win
        )).pack(pady=12)

    def save_edit(self, task, titre_entry, desc_entry, date_entry, urgence_var, statut_var, edit_win):
        task["titre"] = titre_entry.get().strip()
        task["description"] = desc_entry.get().strip()
        task["date"] = date_entry.get_date().strftime('%Y-%m-%d')
        task["urgence"] = urgence_var.get()
        task["statut"] = statut_var.get()
        save_tasks(self.tasks)
        self.refresh_tasks()
        edit_win.destroy()

    def delete_task(self, task):
        if messagebox.askyesno("Suppression", "Supprimer cette tâche ?"):
            self.tasks.remove(task)
            save_tasks(self.tasks)
            self.refresh_tasks()

    def export_tasks(self):
        fp = filedialog.asksaveasfilename(defaultextension=".json", filetypes=[("JSON files", "*.json")])
        if fp:
            with open(fp, "w", encoding="utf-8") as f:
                json.dump(self.tasks, f, ensure_ascii=False, indent=2)

    def import_tasks(self):
        fp = filedialog.askopenfilename(filetypes=[("JSON files", "*.json")])
        if fp:
            with open(fp, "r", encoding="utf-8") as f:
                self.tasks = json.load(f)
            save_tasks(self.tasks)
            self.refresh_tasks()

    def goto_prev_week(self):
        self.week_start -= datetime.timedelta(days=7)
        self.update_weekend_view()

    def goto_next_week(self):
        self.week_start += datetime.timedelta(days=7)
        self.update_weekend_view()

if __name__ == "__main__":
    ctk.set_appearance_mode("light")
    app = TaskManagerApp()
    app.mainloop()
