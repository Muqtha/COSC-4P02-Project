

from bs4 import BeautifulSoup
import requests
import calendar
import mysql.connector
from selenium import webdriver
from selenium.common.exceptions import NoSuchElementException
#import packages above so they can be used with python interpeter

#create database with my_sql called db, with user root and password pegasus
db = mysql.connector.connect( #connect to my database (you need to recreate a similar database on your computer))
    host='db',
    user='root',
    password = 'pegasus',
    port='3306',
    database='db'
)

cursor= db.cursor()
#cursor.execute("CREATE TABLE athletes (atl_id int primary key , name VARCHAR(255), hometown VARCHAR(10000),"
#                   "gender VARCHAR(100),brithyear VARCHAR(100),games VARCHAR(1000),hostlocation VARCHAR(1000),"
#              "startdate DATE,enddate DATE, age int,type VARCHAR(100), contingent VARCHAR(100),sport VARCHAR(100),"
#               "gprofile VARCHAR(1000),team VARCHAR(100),finalpos int)")
#cursor.execute("CREATE TABLE games(game_id int primary key, gamename VARCHAR(255), gamedate VARCHAR(100),gametype VARCHAR(255),"
#               "gameinfo VARCHAR(7000),linktogame VARCHAR(500))")
#cursor.execute("CREATE TABLE results (team_id int  primary key,province VARCHAR(100),sgamesg INT,"
#              "sgamess INT ,sgamesb INT, wgamesg INT,wgamess INT, wgamesb INT,  total INT)")
#cursor.execute("CREATE TABLE teams (id int primary key, name VARCHAR(255), info VARCHAR(7000))")
#db.commit()

unaccept = ['','','','â','Â','\x9d','\x80','\x8d','\x8c','\x9d','\x9c','\x99','','©','Ã','¨','']

def fix(word):
    st = list(word)
    if( len(st) <=1):
        st = st[0]
    word2=""
    for i in st:
        if(i in unaccept):
            if (i=='\x99') or (i=='') or (i==''):
               word2+='`'
            if(i==''):
                word2+='–'
            if(i=='©') or (i=='¨'):
                word2+='é'
            if(i==''):
                word2+='É'
        else:
           word2+=i

    return word2


def searchdate(word,year):
    res = word.split(" ")
    months = calendar.month_name
    altmonths = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    c=0
    for r in res:
        if (c == 1):
            d = r
            c = 0
            return m+" "+d+" "+year
        if (r in months or r in altmonths):
            m = r
            c=1


def travers(elem,input):
    i=0
    resl=""
    if(elem is None):
        return " "
    while i<len(elem):
        if(input==1):
            temp = elem[i].text.split()
            temp= temp[len(temp)-1]
        else:
            temp=elem[i].text
        resl +=temp
        if(i!=len(elem)-1):
            resl+=", "
        i+=1
    return resl


def order(atl):
    orde = ["games","hostlocation","startdate","enddate","contingent","sport","gprofile","team","finalpos"]
    correct = []
    for a in orde:
        for b in atl:
            text=b[0].split(" ")
            if(text[0]==a):
                correct.append(b)
    return correct


def addathlete(atl,atl2,id):
    name=fix(atl[0].text)
    if(len(atl[1])>0):
        hometown=fix(atl[1][0].text).split()
        hometown=hometown[len(hometown)-1]
    else:hometown=""
    if (len(atl[2]) > 0):
        gender = fix(atl[2][0].text).split(" ")
        gender=gender[len(gender)-1]
    else:gender = ""
    if (len(atl[3]) > 0):
        birthyear = fix(atl[3][0].text).split(" ")
        birthyear=birthyear[len(birthyear)-1]
    else:birthyear = ""
    atype=fix(travers(atl[5],1))
    gprofile=fix(travers(atl[6],1))
    atl+=order(atl2)
    games=fix(travers(atl[4],0))
    hostlocation=fix(travers(atl[7],1))
    startdate=fix(travers(atl[8],1))
    enddate=fix(travers(atl[9],1))
    age=fix(travers(atl[10],1))
    contingent=fix(travers(atl[11],1))
    sport=fix(travers(atl[12],1))
    team=fix(travers(atl[13],1))
    finalpos=fix(travers(atl[14],1))
    sql = "SELECT EXISTS (SELECT * from athletes WHERE atl_id ="+ str(id)+")"
    cursor.execute(sql)
    returns =cursor.fetchall()
    if (returns[0][0]<1):
        sql = "INSERT INTO athletes (atl_id,name, hometown,gender,birthyear,games,hostlocation,startdate,enddate" \
              ",age,type,contingent,sport,gprofile,team,finalpos) VALUES (%s,%s, %s,%s, %s,%s, %s, %s,%s, %s, %s,%s, %s, %s,%s)"
        val = (id,name,hometown,gender,birthyear,games,hostlocation,startdate,enddate,age,atype,contingent,sport,
               gprofile,team,finalpos)
        cursor.execute(sql,val) #code to execute sql statements
        db.commit()


def atl():
    atoz = []
    i='Y'
    driver = webdriver.Chrome(r"C:/Users/hp/chromedriver.exe")
    driver.get("https://cgc.gems.pro/AlumCgc/Alumni/FindAlumni_List.aspx")
    driver.implicitly_wait(20)
    id=0
    while(i!='['):
        s="ctl00_ContentPlaceHolder1_btn"+i
        elem = driver.find_element_by_id(s)
        elem.click()
        driver.implicitly_wait(20)
        print(i)
        if(i!='X'):
            elem=driver.find_element_by_link_text("here")
            elem.click()
        driver.implicitly_wait(20)
        atl = driver.find_elements_by_class_name("PersonTile")
        for a in atl:
            athletes=[]
            athletes2=[]
            name = a.text.split("\n")
            name = name[0]
            elem = driver.find_element_by_link_text(name)
            lnk =elem.get_attribute('href')
            newdriver = webdriver.Chrome(r"C:/Users/hp/chromedriver.exe")
            newdriver.get(lnk)
            name = newdriver.find_element_by_id("lblPageTitle")
            athletes.append(name)
            hometown=newdriver.find_elements_by_id("ctl00_ContentPlaceHolder1_trHomeTown")
            athletes.append(hometown)
            gender = newdriver.find_elements_by_id("ctl00_ContentPlaceHolder1_trGender")
            athletes.append(gender)
            birthyear = newdriver.find_elements_by_id("ctl00_ContentPlaceHolder1_trBirthYear")
            athletes.append(birthyear)
            games = newdriver.find_elements_by_class_name("LM_FormSection")
            athletes.append(games)
            atype = newdriver.find_elements_by_class_name("ParticipantType ParticipantTypeCell")
            athletes.append(atype)
            gprofile = newdriver.find_elements_by_link_text("here")
            athletes.append(gprofile)
            allinfo = newdriver.find_elements_by_class_name("GamesInfoCell")
            athletes2.append(allinfo)
            addathlete(athletes,athletes2,id)
        id+=1
        x=i
        i=chr(ord(x)+1)


soup = BeautifulSoup(requests.get("https://www.canadagames.ca/games").text,'lxml')
games = soup.find_all('div',class_="past-card w-dyn-item")
id = 0

for game in games:
    name=fix(game.find('h6').text)
    type = game.find('div',class_="meta is-red").text
    linktoinfo = game.find('a',href=True)
    link  = linktoinfo['href']
    htmltxt="https://www.canadagames.ca"+link
    soup2 = BeautifulSoup(requests.get(htmltxt).text,'lxml')
    info = soup2.find_all('p')
    temp = soup2.find('a',class_="result-link w-inline-block")
    if (temp is not None):
        linktogame =temp['href']
    else:
        linktogame=""
    y = soup2.find('h1',class_="head-display")
    year = y.text.split(" ")
    year=year[len(year)-1]
    word = ""
    count = 0

    for i in info:
        word += fix(i.text)
        if(count==0):
            date_ = searchdate(word,year)
            count+=1
    sql = "SELECT EXISTS (SELECT * from games WHERE game_id = " + str(id) + ")"
    cursor.execute(sql)
    returns = cursor.fetchall()
    if (returns[0][0] < 1):
        sql = "INSERT INTO games (game_id, gamename, gamedate,gametype,gameinfo,linktogame) VALUES ( %s,%s, %s,%s, %s, " \
              "%s)"
        val = (id,name,date_,type,word,linktogame)
        cursor.execute(sql,val)
        db.commit()
    id+=1



#connect to website with beautiful soup and requests python libraries
soup2 = BeautifulSoup(requests.get("https://www.canadagames.ca/results").text, 'lxml')
results = soup2.find_all('div',class_='score-item')
totals = soup2.find_all('div', class_='inline-total')
sports=[]
sportstechpackage= []
soup = BeautifulSoup(requests.get("https://www.canadagames.ca/teams").text, 'lxml')
teams = soup.find_all('div', class_='team-div w-dyn-item')#find all information that has a 'div' html tag and of the class 'team-div w-dyn-item'
print("Teams in competition: ")
id =0
resultcounter = 0
for team in teams:
    count =0
    s = team.text.lower()
    tname=""
    teamn=""
    if (s == "team newfoundland & labrador"):
        s = "team newfoundland labrador"
    for c in s:
        if (count>4):
            teamn+=c
            if(c==' '):
                tname+='-'
            else:
                tname +=c
        count+=1
    if (s == "team newfoundland labrador"):
        teamn = "newfoundland & labrador"
    htmltxt="https://www.canadagames.ca/teams"+"/"+tname
    soup = BeautifulSoup(requests.get(htmltxt).text, 'lxml')
    sql = "SELECT EXISTS (SELECT * from results WHERE team_id = " + str(id) + ")"
    cursor.execute(sql)
    returns = cursor.fetchall()
    if (returns[0][0] < 1):
        sql = "INSERT INTO results (team_id,province,sgamesg,sgamess,sgamesb,wgamesg,wgamess,wgamesb,total) VALUES ( %s,%s, %s,%s, %s, " \
              "%s,%s, %s, %s)"

        val = (id,teamn,results[resultcounter].text,results[resultcounter+1].text,results[resultcounter+2].text,
               results[resultcounter+3].text,results[resultcounter+4].text,results[resultcounter+5].text,totals[id].text)
        cursor.execute(sql,val)
        db.commit()
    teaminfo = soup.find_all('p')
    allinfo=""
    for info in teaminfo:
        allinfo+=fix(info)
    sql = "SELECT EXISTS (SELECT * from teams WHERE id = " + str(id) + ")"
    cursor.execute(sql)
    returns =cursor.fetchall()
    if (returns[0][0]<1):
        sql = "INSERT INTO teams (id,name, info) VALUES (%s, %s, %s)"
        val = (id,teamn,allinfo)
        cursor.execute(sql,val) #code to execute sql statements
        db.commit()
    id += 1
    resultcounter+=6
    print(teamn)

#prints the text results of the teams foudn on the wesbsite
soup = BeautifulSoup(requests.get("https://www.canadagames.ca/sports").text, 'lxml')
sportsavail = soup.find('div', class_='sport-item w-dyn-item')
print ("\nSports available in competition: ")
#sports available returns as a list so traverse list and print all the sports available
while sportsavail:
    subsearch= sportsavail.find('a', class_ ='sport-link w-inline-block').text
    #print(subsearch[1:])
    sports.append(sportsavail)
    sportsavail=sportsavail.nextSibling
#an attempt to scrape an athletes informaion from the website and organize it
sports.append(sportsavail)
print("\n")

#scrape and return all sports overview
k=0
id = 0
for sport in sports:
    #cursor.execute("CREATE TABLE sports (sport_id int primary key, sportname VARCHAR(255), sportinfo VARCHAR(10000),"
                  # "sportpackage VARCHAR(1000))")
    if(k!=39):
        k=k+1
        subsearch = sport.find('a', class_='sport-link w-inline-block').text.replace("\n","")
        txt = subsearch.split(" ")
        s = ""
        count =1;
        for x in range(len(txt)):
            if (count>1):
                s+="-"
                s+=txt[x].lower()
            else:
                s+=txt[x].lower()
                count+=1
        sql = "SELECT EXISTS (SELECT * from sports WHERE sport_id = " + str(id) + ")"
        cursor.execute(sql)
        returns = cursor.fetchall()
        htmltxt = "https://www.canadagames.ca/all-sports/"+s #link to the sports page
        soup = BeautifulSoup(requests.get(htmltxt).text,'lxml')
        packagevaial = soup.find_all('a', class_='primary-btn has-icon w-inline-block', href=True)
        pack = " "
        for a in packagevaial:
            if a['href']!="#":
                    pack = a['href'] #contains the link to the sports tech package
        gameinfo = soup.find_all('p')
        word =""
        for i in gameinfo:
            word += fix(i.text)
        print(word)
        if (returns[0][0] < 1): #check if element already exist in database table because i dont want repeat elements.
            sql = "INSERT INTO sports (sport_id,sportname, sportinfo ,sportpackage) VALUES (%s, %s, %s,%s)" #insert element
            #sql statment
            val = (id, sport.text, word,pack) #table parameters for sql insert
            cursor.execute(sql, val)  # code to execute sql statements
            db.commit()
        id += 1
        print("\n")


