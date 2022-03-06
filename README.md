# COSC-4P02-Project
Group project for COSC 4P02, Software Engineering 2, at Brock University.  
Professor: Naser Ezzati-Jivan

Project: Canada Games Chatbot Software  
Group Name: Five Guys

Members:  
Al-Muqthadir Ajiboye (Team Leader) - 6148068  
Noestama Imoisili - 6568588  
Zach Yerrill - 6589451  
Michael Woody - 6369201  
Jordan Chilcott - 6271357  
Yanis Souiki - 6284392  
Kam Sadiq - 6365548  
Christian Perdigao - 6223283  

Project Description:  
We plan to develop a chatbot software that will be accessed through a website to answer inquiries on the Niagara 2022 Canada Games. The software will take in questions as text and deliver answers and services to the user.  

# Docker Build Instructions
## Docker Install
- Install [Docker Engine](https://docs.docker.com/engine/install/)
- Ensure [Docker Compose](https://docs.docker.com/compose/install/) is installed

## Build Containers
Clone and pull the most recent repository version. Open PowerShell/Terminal and change directory into the repository root. Run the following commands:
```
docker build . --target scraper --tag scraper
docker build . --target frontend --tag frontend
```

## Running Containers in Compose
To run the network of containers, run command:
```
docker compose up -d
```

This will run the network in 'detached' mode as to not use the terminal for output. Logs for a given container can be seen with:
```
docker logs cosc-4p02-project-frontend-1
docker logs cosc-4p02-project-scraper-1
docker logs cosc-4p02-project-db-1
```

## Decompose
To close the network:
```
docker compose down
```

To close and delete all data including database data:
```
docker compose down -v
```

## Notes
Docker Compose does not run the scraping script automatically. This is to avoid unnecessary overhead when starting, the database information will be persistent. To run the scraper:
```
docker compose up scraper -d
```

To remove the scraper container:
```
docker container rm cosc-4p02-project-scraper-1
```

To use the terminal in mysql run:
```
docker exec -it cosc-4p02-project-db-1 bash
```

Once in the root of the container terminal:
```
mysql --user=root --password db
```