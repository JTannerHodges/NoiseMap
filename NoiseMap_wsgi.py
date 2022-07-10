# Copyright (C) 2022, Tanner Hodges, University of North Georgia
# Additional sources:
# Dr. Huidae Cho - University of North Georgia
# waveform_analysis by Endolith: https://github.com/endolith/waveform_analysis
# StackOverflow User: Isaac - https://stackoverflow.com/questions/13243690/decibel-values-at-specific-points-in-wav-file
# PySoundFile: https://pysoundfile.readthedocs.io/en/latest/

#!C:/opt/Python310/python.exe
from bottle import get, post, static_file, default_app, request
import os.path
import sqlite3
import collections
import json
import numpy as np
import soundfile as sf
import waveform_analysis as wa


# Location of database
db_path = "app/data.db"

# Variables listed in database
Record = collections.namedtuple("Record", ("id", "name", "lat", "lon", "noise_type", "noise_val", "desc"))

def send_webapp_file(filename):
    return static_file(filename, root="app")


@get("/")
def index():
    return send_file("map.html")

# "Communicate" with requisite files according to RegEx conditions listed
@get("/<filename:re:map\.(html|css|js)|.*\.(png|svg)>")
def send_file(filename):
    return send_webapp_file(filename)

# Extract averaged dBFS value from user sound file
def audio_processing(wav_file):
    # Read user sound file, get sample rate
    user_wav, samprate = sf.read(wav_file)

    # Apply A-Weighted curve to numpy array (user_wav)
    a_wt = wa.A_weight(user_wav, samprate)

    # Compute average
    chunks = np.array_split(a_wt, 1)
    dbfs = [20*np.log10(np.sqrt(np.mean(chunk**2))) for chunk in chunks][0]
    rnd = round(dbfs, 1)
    return rnd

# Retrieve user entry and submit to server
@post("/")
def post_data():
    name = request.forms.get("name")
    lat = request.forms.get("lat")
    lon = request.forms.get("lon")
    noise_type = request.forms.get("noise")
    desc = request.forms.get("desc")

    upload = request.files.get('filename')
    _, ext = os.path.splitext(upload.filename)
    if ext.lower() != ".wav":
        return 'Incompatible format. Please ensure file is in .wav format.'

    noise_val = audio_processing(upload.file)

    if write_data(name, lat, lon, noise_type, noise_val, desc):
        return send_webapp_file("success.html")
    else:
        return send_webapp_file("failure.html")

# Retrieve and view data stored in data.db file through URL
@get("/data")
def get_data():
    return convert_records_to_json(read_data())


# Convert database records to dictionary (JSON)
def convert_records_to_json(recs):
    ret = "["
    nrecs = len(recs)
    for i in range(nrecs):
        rec = recs[i]
        ret += json.dumps(rec._asdict())
        if i < nrecs - 1:
            ret += ", "
    ret += "]"
    return ret

# Construct SQLite database
def write_data(name, lat, lon, noise_type, noise_val, desc):
    if not os.path.exists(db_path):
        con = sqlite3.connect(db_path)
        con.execute("""CREATE TABLE records (
            id integer primary key autoincrement,
            name varchar (100) not null,
            lat double precision not null,
            lon double precision not null,
            noise_type varchar (100) not null,
            noise_val double precision not null,
            desc text not null)""")
    else:
        con = sqlite3.connect(db_path)

    cur = con.cursor()
    cur.execute("""INSERT INTO records (name, lat, lon, noise_type, noise_val, desc)
                VALUES(?, ?, ?, ?, ?, ?)""", (name, lat, lon, noise_type, noise_val, desc))
    con.commit()
    status = cur.rowcount == 1
    con.close()
    return status

# Append data to corresponding variable in database
def read_data():
    recs = []
    if os.path.exists(db_path):
        con = sqlite3.connect(db_path)
        cur = con.cursor()

        for row in cur.execute("SELECT * FROM records"):
            rec = Record(row[0], row[1], row[2], row[3], row[4], row[5], row[6])
            recs.append(rec)
        con.close()
    return recs

application = default_app()
