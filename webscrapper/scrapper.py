

from bs4 import BeautifulSoup
import requests
from requests_html import HTMLSession
import mysql.connector
#beautiful soup and requests python libraries required

#to do list:
# * create scrappper for getting all past games
# * write python code to create and populate tables in database


db = mysql.connector.connect( #connect to my database (you need to recreate a similar database on your computer))
    host='localhost',
    user='root',
    password = 'pegasus',
    port='3306',
    database='db'
)
cursor= db.cursor()
def fix(word):
    st = list(word)
    if( len(st) <=1):
        st = st[0]
    word2=""
    counter =0
    for i in st:
       if (i=='â') or (i=='\x9d') or (i=='\x80') or(i=='\x8d')or(i=='\x8c') or (i=='\x9d') or (i=='\x9c')or (i=='\x99'):
           if (i=='\x99'):
               word2+='`'
       else:
           word2+=i

    return word2
#cursor.execute("CREATE TABLE teams (id int primary key, name VARCHAR(255), info VARCHAR(7000))")
db.commit()
#connect to website with beautiful soup and requests python libraries
sports=[]
sportstechpackage= []
soup = BeautifulSoup(requests.get("https://www.canadagames.ca/teams").text, 'lxml')
teams = soup.find_all('div', class_='team-div w-dyn-item')#find all information that has a 'div' html tag and of the class 'team-div w-dyn-item'
print("Teams in competition: ")
id =0
for team in teams:
    count =0
    s = team.text.lower()
    tname=""
    for c in s:
        if (count>4):
            if(c==' '):
                tname+='-'
            else:
                tname +=c
        count+=1

    htmltxt="https://www.canadagames.ca/teams"+"/"+tname
    soup = BeautifulSoup(requests.get(htmltxt).text, 'lxml')
    teaminfo = soup.find_all('p')
    allinfo=""
    for info in teaminfo:
        allinfo+=fix(info)
    sql = "SELECT EXISTS (SELECT * from teams WHERE id = " + str(id) + ")"
    cursor.execute(sql)
    returns =cursor.fetchall()
    if (returns[0][0]<1):
        sql = "INSERT INTO teams (id,name, info) VALUES (%s, %s, %s)"
        val = (id,team.text,allinfo)
        cursor.execute(sql,val) #code to execute sql statements
        db.commit()
    id += 1
    print(team.text)

#prints the text results of the teams foudn on the wesbsite
soup = BeautifulSoup(requests.get("https://www.canadagames.ca/sports").text, 'lxml')
sportsavail = soup.find('div', class_='sport-item w-dyn-item')
print ("\nSports available in competition: ")
#sports available returns as a list so traverse list and print all the sports available
while sportsavail.nextSibling:
    subsearch= sportsavail.find('a', class_ ='sport-link w-inline-block').text
    #print(subsearch[1:])
    sports.append(sportsavail)
    sportsavail=sportsavail.nextSibling
#an attempt to scrape an athletes informaion from the website and organize it
print("\n")

#scrape and return all sports overview
k=0
id = 0
for sport in sports:
    #cursor.execute("CREATE TABLE sports (sport_id int primary key, sportname VARCHAR(255), sportinfo VARCHAR(10000),"
                  # "sportpackage VARCHAR(1000))")
    if (k==10):
        k=0
    k+=1
    subsearch = sport.find('a', class_='sport-link w-inline-block').text.replace("\n","")
    txt = subsearch.split(" ")
    if (subsearch == "Diving"):
       i=1
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


firstname=""
lastname=""
games=""
contigent = ""
type = "Athlete"
sport = "Archery"
session = HTMLSession()
payload = {'First name': firstname, 'Last name': lastname, 'Games': games, 'Type': type, 'Sport': sport}
htmltxt ="https://cgc.gems.pro/AlumCgc/Alumni/FindAlumni_List.aspx"
site= session.get(htmltxt)
soup = BeautifulSoup(requests.get("https://cgc.gems.pro/AlumCgc/Alumni/FindAlumni_List.aspx").text, 'lxml')
select = soup.find_all('input',class_='LM_Button LetterSearchButton')
session.post(htmltxt,data=payload)
result = session.get(htmltxt)
#result = session.get(url = htmltxt, params = payload).html.url
soup = BeautifulSoup(requests.get(result).text, 'lxml')
result2 = soup.find_all('div', class_='FindAlumniList')
#l = result[0]['href']
#soup = BeautifulSoup(requests.get(l).text,'lxml')
result = soup.find_all('tr')
for i in result:
    print(result)

