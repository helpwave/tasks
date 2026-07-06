DE_LABELS = {
    "tasks_title": "Aufgaben",
    "patients_title": "Patienten",
    "generated_at": "Erstellt am",
    "generated_by": "von",
    "entries": "Einträge",
    "page": "Seite",
    "page_of": "von",
    "yes": "Ja",
    "no": "Nein",
    "no_patient": "Kein Patient",
    "years": "Jahre",
    "state_WAIT": "Wartend",
    "state_ADMITTED": "Aufgenommen",
    "state_DISCHARGED": "Entlassen",
    "state_DEAD": "Verstorben",
    "sex_MALE": "Männlich",
    "sex_FEMALE": "Weiblich",
    "sex_UNKNOWN": "Divers",
}

EN_LABELS = {
    "tasks_title": "Tasks",
    "patients_title": "Patients",
    "generated_at": "Generated at",
    "generated_by": "by",
    "entries": "entries",
    "page": "Page",
    "page_of": "of",
    "yes": "Yes",
    "no": "No",
    "no_patient": "No patient",
    "years": "years",
    "state_WAIT": "Waiting",
    "state_ADMITTED": "Admitted",
    "state_DISCHARGED": "Discharged",
    "state_DEAD": "Deceased",
    "sex_MALE": "Male",
    "sex_FEMALE": "Female",
    "sex_UNKNOWN": "Diverse",
}

DE_FORMATS = {
    "date": "%d.%m.%Y",
    "datetime": "%d.%m.%Y %H:%M",
    "xlsx_date": "DD.MM.YYYY",
    "xlsx_datetime": "DD.MM.YYYY HH:MM",
    "decimal_separator": ",",
}

EN_FORMATS = {
    "date": "%Y-%m-%d",
    "datetime": "%Y-%m-%d %H:%M",
    "xlsx_date": "YYYY-MM-DD",
    "xlsx_datetime": "YYYY-MM-DD HH:MM",
    "decimal_separator": ".",
}


def is_german_locale(locale: str | None) -> bool:
    return bool(locale) and locale.strip().lower().startswith("de")


def get_labels(locale: str | None) -> dict[str, str]:
    return DE_LABELS if is_german_locale(locale) else EN_LABELS


def get_formats(locale: str | None) -> dict[str, str]:
    return DE_FORMATS if is_german_locale(locale) else EN_FORMATS
