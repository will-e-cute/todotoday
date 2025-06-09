import tkinter as tk
from tkinter import messagebox
from tkcalendar import Calendar
from datetime import datetime
import json
import os

# Fichier JSON pour stocker les données
JSON_FILE = "todo.json"

# Fonction pour charger les données du fichier JSON
def load_data():
    if os.path.exists(JSON_FILE):
        with open(JSON_FILE, "r") as file:
            return json.load(file)
    return {}

# Fonction pour enregistrer les données dans le fichier JSON
def save_data(data):
    with open(JSON_FILE, "w") as file:
        json.dump(data, file, indent=4)

# Fonction pour mettre à jour les marques dans le calendrier
def update_calendar_marks(calendar, data):
    calendar.calevent_remove('all')  # Supprimer toutes les marques existantes
    for date_str in data.keys():
        try:
            # Convertir la date (string) en objet datetime.date
            marked_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            calendar.calevent_create(marked_date, "Tâches enregistrées", "marked")  # Ajouter une marque sur les jours avec des tâches
        except ValueError:
            print(f"Erreur : le format de la date '{date_str}' est incorrect. Attendu : 'YYYY-MM-DD'.")

# Fenêtre principale
class ToDoApp:
    def __init__(self, root):
        self.root = root
        self.root.title("2do2d")
        self.root.geometry("400x750")
        
        # Chargement des données existantes
        self.data = load_data()
        
        # Titre principal
        self.title_label = tk.Label(root, text="Todo Today", font=("Arial", 16), bg="#DFF6F0", fg="#004D40")
        self.title_label.pack(fill="x", pady=5)
        
        # Calendrier pour sélectionner une date
        self.calendar = Calendar(root, selectmode="day", year=2025, month=3, day=11)
        self.calendar.pack(pady=10)
        
        # Configuration des marques dans le calendrier
        self.calendar.tag_config("marked", background="lightblue", foreground="black")
        
        update_calendar_marks(self.calendar, self.data)
        
        # Bouton pour ouvrir une date spécifique
        self.open_button = tk.Button(root, text="Ouvrir", command=self.open_date)
        self.open_button.pack(pady=10)
        
        # Conteneur pour les tâches
        self.task_frame = tk.Frame(root)
        self.task_frame.pack(pady=10)
        
        # Liste des champs de saisie et cases à cocher
        self.task_entries = []
        self.task_checkboxes = []
        
        for i in range(10):
            frame = tk.Frame(self.task_frame)
            frame.pack(fill="x", pady=5)
            
            checkbox_var = tk.BooleanVar()
            checkbox = tk.Checkbutton(frame, variable=checkbox_var)
            checkbox.pack(side="left")
            
            entry = tk.Entry(frame, width=40)
            entry.pack(side="left", padx=5)
            
            self.task_entries.append(entry)
            self.task_checkboxes.append(checkbox_var)
        
        # Boutons Enregistrer et Quitter
        button_frame = tk.Frame(root)
        button_frame.pack(pady=10)
        
        self.save_button = tk.Button(button_frame, text="Enregistrer", command=self.save_tasks)
        self.save_button.pack(side="left", padx=5)
        
        # Bouton pour quitter l'application
        quit_button = tk.Button(button_frame, text="Quitter", command=self.on_closing)
        quit_button.pack(side="left", padx=5)
        
        # Mettre à jour le titre avec la date initiale
        self.update_title()
    
    def update_title(self):
        selected_date = self.calendar.get_date()
        
        try:
            # Convertir la date sélectionnée en format ISO (YYYY-MM-DD)
            selected_date_str = datetime.strptime(selected_date, "%m/%d/%y").strftime("%Y-%m-%d")
        except ValueError:
            return
        
        self.title_label['text'] = f"Todo Today - {selected_date_str}"
    
    def open_date(self):
        selected_date = self.calendar.get_date()
        
        try:
            # Convertir la date sélectionnée en format ISO (YYYY-MM-DD)
            selected_date_str = datetime.strptime(selected_date, "%m/%d/%y").strftime("%Y-%m-%d")
        except ValueError:
            return
        
        if selected_date_str in self.data:
            tasks = self.data[selected_date_str]
            for i in range(10):
                if i < len(tasks):
                    task_text, task_done = tasks[i]
                    self.task_entries[i].delete(0, tk.END)
                    self.task_entries[i].insert(0, task_text)
                    self.task_checkboxes[i].set(task_done)
                else:
                    self.task_entries[i].delete(0, tk.END)
                    self.task_checkboxes[i].set(False)
        else:
            for i in range(10):
                self.task_entries[i].delete(0, tk.END)
                self.task_checkboxes[i].set(False)
        
        # Enregistrer les données avant de changer de date
        self.save_tasks_before_change()
        
        # Mettre à jour le titre après avoir ouvert une date
        self.update_title()
    
    def save_tasks_before_change(self):
        selected_date = self.calendar.get_date()
        
        try:
            # Convertir la date sélectionnée en format ISO (YYYY-MM-DD)
            selected_date_str = datetime.strptime(selected_date, "%m/%d/%y").strftime("%Y-%m-%d")
        except ValueError:
            return
        
        tasks = []
        for entry, checkbox_var in zip(self.task_entries, self.task_checkboxes):
            task_text = entry.get()
            task_done = checkbox_var.get()
            if task_text.strip():  # Enregistrer uniquement les tâches non vides
                tasks.append((task_text.strip(), task_done))
        
        if tasks:
            self.data[selected_date_str] = tasks
            save_data(self.data)
            update_calendar_marks(self.calendar, self.data)  # Mettre à jour le calendrier avec les nouvelles marques
    
    def save_tasks(self):
        selected_date = self.calendar.get_date()
        
        try:
            # Convertir la date sélectionnée en format ISO (YYYY-MM-DD)
            selected_date_str = datetime.strptime(selected_date, "%m/%d/%y").strftime("%Y-%m-%d")
        except ValueError:
            return
        
        tasks = []
        for entry, checkbox_var in zip(self.task_entries, self.task_checkboxes):
            task_text = entry.get()
            task_done = checkbox_var.get()
            if task_text.strip():  # Enregistrer uniquement les tâches non vides
                tasks.append((task_text.strip(), task_done))
        
        if tasks:
            self.data[selected_date_str] = tasks
            save_data(self.data)
            update_calendar_marks(self.calendar, self.data)  # Mettre à jour le calendrier avec les nouvelles marques
    
    def on_closing(self):
        # Enregistrer les données avant de fermer l'application
        self.save_tasks_before_change()
        self.root.destroy()

# Exécution du programme principal
if __name__ == "__main__":
    root = tk.Tk()
    app = ToDoApp(root)
    root.mainloop()
