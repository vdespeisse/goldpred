from BeautifulSoup import BeautifulSoup
import csv
import urllib

def parseTable(path, tableClass = "historicalTbl", name = "fuck"):
    with open('../parseddata/'+name+'.csv', 'wb') as csvfile:
        csvwriter = csv.writer(csvfile, delimiter=',',
         quoting=csv.QUOTE_MINIMAL)

        html_doc = urllib.urlopen(path).read()
        soup = BeautifulSoup(html_doc)
        table = soup.find('table')

        table_head = table.find('thead').findAll('th')
        csvwriter.writerow([el.text.strip() for el in table_head])
        print [el.text.strip() for el in table_head]

        table_body = table.find('tbody')
        rows = table_body.findAll('tr')
        for row in rows:
            cols = row.findAll('td')
            cols = [el.text.strip() for el in cols]
            csvwriter.writerow(cols)
