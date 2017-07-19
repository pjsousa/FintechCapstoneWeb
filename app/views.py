from flask import render_template, flash, redirect, jsonify
from app import app
#from .forms import LoginForm

import numpy as np
import pandas as pd


@app.route('/')
@app.route('/index')
def index():
    user = {'nickname': 'Miguel'}  # fake user
    posts = [  # fake array of posts
        { 
            'author': {'nickname': 'John'}, 
            'body': 'Beautiful day in Portland!' 
        },
        { 
            'author': {'nickname': 'Susan'}, 
            'body': 'The Avengers movie was so cool!' 
        }
    ]
    return render_template("index.html",
                           title='Home',
                           user=user,
                           posts=posts)


@app.route('/tickers', methods=['GET'])
def tickers():
  _r = pd.read_csv("app/data/tickers_nasdaq100.csv")
  _r = _r.where((pd.notnull(_r)), None)
  _r = _r[_r["Symbol"].isin(["AAPL", "NFLX", "NVDA"])]
  return jsonify({'columns': _r.columns.tolist()
                  , 'data': _r.values.tolist()})

@app.route('/prices/<ticker>', methods=['GET'])
def prices(ticker):
  try:
    _r = pd.read_csv("app/data/{}.csv".format(ticker))
    _r = _r.where((pd.notnull(_r)), None)
  except IOError:
    _r = pd.DataFrame()
  return jsonify({'columns': _r.columns.tolist()
                  , 'data': _r.values.tolist()})

@app.route('/predict/<ticker>', methods=['GET'])
def predict(ticker):
  try:
    _r = pd.read_csv("app/data/predictions.csv")
    _r = _r.where((pd.notnull(_r)), None)
    _r = _r[_r["Ticker"] == ticker]
    _r.drop('Ticker', axis=1, inplace=True)

  except IOError:
    _r = pd.DataFrame()
  return jsonify({'columns': _r.columns.tolist()
                  , 'data': _r.values.tolist()})



@app.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        flash('Login requested for OpenID="%s", remember_me=%s' %
              (form.openid.data, str(form.remember_me.data)))
        return redirect('/index')
    return render_template('login.html', 
                           title='Sign In',
                           form=form,
                           providers=app.config['OPENID_PROVIDERS'])
